import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumen — AI knowledge for your documents",
  description: "Upload documents, ask anything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-text antialiased">
        {/* ambient background */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute inset-0 bg-aurora opacity-60" />
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-accent/5 to-transparent" />
        </div>

        {children}

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#12121c",
              border: "1px solid #22222f",
              color: "#e8e8f0",
            },
          }}
        />
      </body>
    </html>
  );
}
