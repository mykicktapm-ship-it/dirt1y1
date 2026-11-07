"use client";

import { ClientProvider } from "@solana/react";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";

import { type DCChainClient, dcChainClient } from "../client";
import { DCWalletDialog } from "./DCWalletDialog";

interface DCChainContextValue {
  client: DCChainClient;
  closeWalletDialog: () => void;
  isWalletDialogOpen: boolean;
  openWalletDialog: () => void;
}

const DCChainContext = createContext<DCChainContextValue | null>(null);

export interface DCChainProviderProps {
  children: ReactNode;
}

export function DCChainProvider({ children }: DCChainProviderProps) {
  const [isWalletDialogOpen, setWalletDialogOpen] = useState(false);
  const openWalletDialog = useCallback(() => setWalletDialogOpen(true), []);
  const closeWalletDialog = useCallback(() => setWalletDialogOpen(false), []);

  const contextValue = useMemo<DCChainContextValue>(
    () => ({
      client: dcChainClient,
      closeWalletDialog,
      isWalletDialogOpen,
      openWalletDialog,
    }),
    [closeWalletDialog, isWalletDialogOpen, openWalletDialog],
  );

  return (
    <ClientProvider client={dcChainClient}>
      <DCChainContext.Provider value={contextValue}>
        {children}
        <DCWalletDialog />
      </DCChainContext.Provider>
    </ClientProvider>
  );
}

export function useDCChain(): DCChainContextValue {
  const context = useContext(DCChainContext);

  if (!context) {
    throw new Error("useDCChain must be used inside DCChainProvider");
  }

  return context;
}
