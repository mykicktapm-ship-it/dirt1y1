"use client";

import {
  useConnectedWallet,
  useIsWalletReady,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useDCChain } from "@/dc-chain";
import { cn } from "@/lib/utils";
import styles from "./home-access-actions.module.scss";

export interface HomeAccessActionsProps {
  onContinue: () => void;
  className?: string;
}

export function HomeAccessActions({ onContinue, className }: HomeAccessActionsProps) {
  const { client, isWalletDialogOpen, openWalletDialog } = useDCChain();
  const connectedWallet = useConnectedWallet(client);
  const isReady = useIsWalletReady(client);
  const status = useWalletStatus(client);
  const [isMounted, setIsMounted] = useState(false);
  const requestedConnection = useRef(false);
  const dialogWasOpen = useRef(false);
  const connected = connectedWallet !== null;
  const busy = status === "connecting" || status === "disconnecting" || status === "reconnecting";

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!requestedConnection.current) return;
    if (connected) {
      requestedConnection.current = false;
      dialogWasOpen.current = false;
      onContinue();
    } else if (isWalletDialogOpen) {
      dialogWasOpen.current = true;
    } else if (dialogWasOpen.current && !busy) {
      requestedConnection.current = false;
      dialogWasOpen.current = false;
    }
  }, [busy, connected, isWalletDialogOpen, onContinue]);

  return (
    <div className={cn(styles.actions, className)}>
      <button
        aria-busy={!isMounted || !isReady || busy || undefined}
        aria-label={connected ? "Continue with connected wallet" : "Connect Solana wallet"}
        className={styles.connect}
        disabled={!isMounted || !isReady || busy}
        onClick={() => {
          if (connected) {
            onContinue();
            return;
          }
          requestedConnection.current = true;
          openWalletDialog();
        }}
        type="button"
      >
        <Wallet aria-hidden="true" className={styles.walletIcon} />
        {busy ? "Connecting…" : connected ? "Continue" : "Connect"}
      </button>
      <button
        className={styles.guest}
        onClick={() => {
          requestedConnection.current = false;
          dialogWasOpen.current = false;
          onContinue();
        }}
        type="button"
      >
        Continue as guest
      </button>
    </div>
  );
}
