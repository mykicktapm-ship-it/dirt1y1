"use client";

import { SkeletonImage } from "@/dc-ui";
import { useConnect, useWallets } from "@solana/kit-plugin-wallet/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { useDCChain } from "./DCChainProvider";
import styles from "./wallet-dialog.module.scss";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Wallet connection failed";
}

export function DCWalletDialog() {
  const { client, closeWalletDialog, isWalletDialogOpen } = useDCChain();
  const wallets = useWallets(client);
  const connect = useConnect(client);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isWalletDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !connect.isRunning) closeWalletDialog();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWalletDialog, connect.isRunning, isWalletDialogOpen]);

  if (!isWalletDialogOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !connect.isRunning) closeWalletDialog();
      }}
    >
      <dialog
        aria-labelledby="dc-wallet-dialog-title"
        aria-modal="true"
        className={styles.dialog}
        open
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Solana mainnet</p>
            <h2 className={styles.title} id="dc-wallet-dialog-title">
              Connect wallet
            </h2>
          </div>
          <button
            aria-label="Close wallet dialog"
            className={styles.close}
            disabled={connect.isRunning}
            onClick={closeWalletDialog}
            type="button"
          >
            ×
          </button>
        </div>

        <div className={styles.wallets}>
          {wallets.map((wallet) => (
            <button
              className={styles.wallet}
              disabled={connect.isRunning}
              key={wallet.name}
              onClick={() => {
                connect
                  .dispatchAsync(wallet)
                  .then(closeWalletDialog)
                  .catch(() => undefined);
              }}
              type="button"
            >
              <SkeletonImage
                alt=""
                shape="circle"
                className={styles.walletIcon}
                height={36}
                src={wallet.icon}
                width={36}
              />
              <span>{wallet.name}</span>
              <span aria-hidden="true" className={styles.arrow}>
                →
              </span>
            </button>
          ))}

          {wallets.length === 0 ? (
            <div className={styles.empty}>
              No compatible Solana wallet was detected in this browser.
            </div>
          ) : null}
        </div>

        {connect.error ? (
          <p className={styles.error} role="alert">
            {getErrorMessage(connect.error)}
          </p>
        ) : null}

        <p className={styles.note}>
          Dirtycoin never receives your recovery phrase or private keys. Connection and signing stay
          inside your wallet.
        </p>
      </dialog>
    </div>,
    document.body,
  );
}
