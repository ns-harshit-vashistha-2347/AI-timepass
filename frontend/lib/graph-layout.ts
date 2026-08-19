// Generic layout engine for turning a LangGraph-style node/edge list into
// a "rows of desks" layout. Nothing in here is department-specific — it
// works for any graph shape, which is what lets a new department appear
// in the office with zero frontend changes: the backend just needs to
// report its nodes and edges (e.g. via GET /departments/{id}/topology).

export interface GraphNode {
  id: string;
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphTopology {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Groups nodes into layers using longest-path-from-source layering
 * (a Kahn's-algorithm variant). Nodes with no unresolved dependencies
 * land in the same layer, so real fan-out (e.g. dense + bm25 running
 * in parallel) renders as two desks side by side, not stacked in a
 * fake sequence.
 */
export function computeLayers(topology: GraphTopology): GraphNode[][] {
  const { nodes, edges } = topology;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  nodes.forEach((n) => {
    incoming.set(n.id, new Set());
    outgoing.set(n.id, new Set());
  });
  edges.forEach((e) => {
    if (!nodeMap.has(e.from) || !nodeMap.has(e.to)) return;
    incoming.get(e.to)?.add(e.from);
    outgoing.get(e.from)?.add(e.to);
  });

  const layerOf = new Map<string, number>();
  const queue: string[] = nodes
    .filter((n) => (incoming.get(n.id)?.size ?? 0) === 0)
    .map((n) => n.id);
  queue.forEach((id) => layerOf.set(id, 0));

  const resolved = new Set<string>();
  let cursor = 0;
  while (cursor < queue.length) {
    const id = queue[cursor++];
    resolved.add(id);
    const myLayer = layerOf.get(id) ?? 0;

    outgoing.get(id)?.forEach((nextId) => {
      const candidateLayer = myLayer + 1;
      const existing = layerOf.get(nextId);
      if (existing === undefined || candidateLayer > existing) {
        layerOf.set(nextId, candidateLayer);
      }
      const stillWaiting = Array.from(incoming.get(nextId) ?? []).some(
        (dep) => !resolved.has(dep)
      );
      if (!stillWaiting && !queue.includes(nextId)) {
        queue.push(nextId);
      }
    });
  }

  // Any node the graph didn't resolve (cycles, disconnected nodes)
  // still gets placed so the layout never silently drops a desk.
  nodes.forEach((n) => {
    if (!layerOf.has(n.id)) layerOf.set(n.id, 0);
  });

  const maxLayer = Math.max(0, ...Array.from(layerOf.values()));
  const layers: GraphNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
  nodes.forEach((n) => {
    layers[layerOf.get(n.id) ?? 0].push(n);
  });

  return layers.filter((layer) => layer.length > 0);
}
