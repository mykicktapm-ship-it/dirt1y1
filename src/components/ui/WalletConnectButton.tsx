"use client";

import {
  useConnectedWallet,
  useDisconnect,
  useIsWalletReady,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDCChain } from "@/dc-chain";

import { GlassButton } from "./glass-button";
import { SkeletonImage } from "./skeleton-image";
import { BarSkeleton } from "./skeleton-shapes";

/** Product-owned wallet control backed by DC Chain and Wallet Standard. */
export const WalletConnectButton: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { client, openWalletDialog } = useDCChain();
  const connectedWallet = useConnectedWallet(client);
  const status = useWalletStatus(client);
  const isReady = useIsWalletReady(client);
  const disconnect = useDisconnect(client);
  const connected = connectedWallet !== null;
  const isInitializing = !isMounted || !isReady;
  const isBusy =
    disconnect.isRunning ||
    status === "connecting" ||
    status === "disconnecting" ||
    status === "reconnecting";

  useEffect(() => setIsMounted(true), []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (connected) {
        disconnect.dispatch();
      } else {
        openWalletDialog();
      }
    },
    [connected, disconnect, openWalletDialog],
  );

  const displayAddress = useMemo(() => {
    const walletAddress = connectedWallet?.account.address;
    if (!walletAddress) return "";
    return `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
  }, [connectedWallet]);

  const startIcon = useMemo(() => {
    if (connectedWallet?.wallet.icon) {
      return (
        <SkeletonImage
          alt={`${connectedWallet.wallet.name} icon`}
          height={16}
          shape="circle"
          src={connectedWallet.wallet.icon}
          width={16}
        />
      );
    }

    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="16"
      >
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    );
  }, [connectedWallet]);

  const buttonText = isBusy ? "Connecting…" : connected ? displayAddress : "Connect";

  return (
    <GlassButton
      aria-busy={isInitializing || isBusy || undefined}
      aria-label={connected ? `Disconnect wallet ${displayAddress}` : "Connect Solana wallet"}
      contentClassName="flex items-center gap-0"
      disabled={!isMounted || !isReady || isBusy}
      onClick={handleClick}
      size="sm"
    >
      <span
        style={{
          alignItems: "center",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "50%",
          display: "inline-flex",
          flexShrink: 0,
          height: 22,
          justifyContent: "center",
          marginRight: 8,
          overflow: "hidden",
          width: 22,
        }}
      >
        {startIcon}
      </span>
      <span style={{ paddingRight: 4, paddingTop: 1 }}>
        {isInitializing && !isBusy ? (
          <BarSkeleton as="span" className="inline-flex" style={{ height: 16, width: 52 }} />
        ) : (
          buttonText
        )}
      </span>
    </GlassButton>
  );
};

export default WalletConnectButton;
