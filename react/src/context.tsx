import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { BrenoxClient } from "@brenox/sdk";

const BrenoxContext = createContext<BrenoxClient | null>(null);

export interface BrenoxProviderProps {
  client: BrenoxClient;
  children: ReactNode;
}

export function BrenoxProvider({ client, children }: BrenoxProviderProps) {
  return (
    <BrenoxContext.Provider value={client}>{children}</BrenoxContext.Provider>
  );
}

export function useBrenoxClient(): BrenoxClient {
  const client = useContext(BrenoxContext);
  if (!client) {
    throw new Error("useBrenoxClient must be used within BrenoxProvider");
  }
  return client;
}
