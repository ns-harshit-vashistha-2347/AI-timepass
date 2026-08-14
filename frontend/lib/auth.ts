import { api } from "./api";
import { API_URL } from "./env";
import { tokenStore } from "./token-store";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  provider: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authApi = {
  async signup(email: string, password: string, fullName?: string) {
    const data = await api.post<TokenPair>(
      "/auth/signup",
      { email, password, full_name: fullName || null },
      false
    );
    tokenStore.set(data.access_token, data.refresh_token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await api.post<TokenPair>(
      "/auth/login",
      { email, password },
      false
    );
    tokenStore.set(data.access_token, data.refresh_token);
    return data;
  },

  async logout() {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await api.post("/auth/logout", { refresh_token: refresh });
      } catch {
        // ignore - still clear locally
      }
    }
    tokenStore.clear();
  },

  me() {
    return api.get<User>("/auth/me");
  },

  googleLoginUrl() {
    return `${API_URL}/auth/google/login`;
  },
};
