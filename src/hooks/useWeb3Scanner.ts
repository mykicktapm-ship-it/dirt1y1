"use client";

import { type Address, address } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getDCWalletBalances, useDCChain } from "@/dc-chain";

export interface Web3ScanResult {
  /** Connected Wallet Standard account address. */
  walletAddress: string | null;
  /** Native SOL balance (in SOL, not lamports). */
  solBalance: number | null;
  /** Native SOL balance in exact lamports. */
  lamports: bigint | null;
  /** Oldest confirmed RPC slot represented by the displayed balances. */
  slot: bigint | null;
  /** SPL token balance adjusted for decimals, retained for existing UI consumers. */
  tokenBalance: number | null;
  /** Exact SPL token quantity in fractional units. */
  tokenAmount: bigint | null;
  /** Exact display-safe SPL token quantity. */
  tokenBalanceString: string | null;
  /** Number of decimals for the SPL token. */
  tokenDecimals: number | null;
  /** Whether a scan is currently in progress. */
  isScanning: boolean;
  /** Error message if the last scan failed, null otherwise. */
  error: string | null;
  /** Manually trigger a rescan. */
  rescan: () => void;
}

export function useWeb3Scanner(): Web3ScanResult {
  const { client } = useDCChain();
  const connectedWallet = useConnectedWallet(client);
  const walletAddress = connectedWallet?.account.address;

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [lamports, setLamports] = useState<bigint | null>(null);
  const [slot, setSlot] = useState<bigint | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenAmount, setTokenAmount] = useState<bigint | null>(null);
  const [tokenBalanceString, setTokenBalanceString] = useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    walletAddress: string;
  } | null>(null);
  const [scannedWalletAddress, setScannedWalletAddress] = useState<string | null>(null);
  const activeScan = useRef<AbortController | null>(null);

  const scan = useCallback(() => {
    activeScan.current?.abort();

    if (!walletAddress) {
      setSolBalance(null);
      setLamports(null);
      setSlot(null);
      setTokenBalance(null);
      setTokenAmount(null);
      setTokenBalanceString(null);
      setTokenDecimals(null);
      setErrorState(null);
      setScannedWalletAddress(null);
      setIsScanning(false);
      return;
    }

    let owner: Address;
    try {
      owner = address(walletAddress);
    } catch {
      setSolBalance(null);
      setLamports(null);
      setSlot(null);
      setTokenBalance(null);
      setTokenAmount(null);
      setTokenBalanceString(null);
      setTokenDecimals(null);
      setErrorState({ message: "Connected wallet address is invalid", walletAddress });
      setScannedWalletAddress(null);
      setIsScanning(false);
      return;
    }

    const controller = new AbortController();
    activeScan.current = controller;
    setIsScanning(true);
    setErrorState(null);

    void getDCWalletBalances(owner, controller.signal)
      .then((balances) => {
        if (controller.signal.aborted) return;

        setSolBalance(balances.sol);
        setLamports(balances.lamports);
        setSlot(balances.slot);
        setTokenBalance(balances.tokenUiAmount);
        setTokenAmount(balances.tokenAmount);
        setTokenBalanceString(balances.tokenUiAmountString);
        setTokenDecimals(balances.tokenDecimals);
        setScannedWalletAddress(walletAddress);
      })
      .catch((scanError: unknown) => {
        if (controller.signal.aborted) return;

        setErrorState({
          message: scanError instanceof Error ? scanError.message : "Failed to scan wallet",
          walletAddress,
        });
        setSolBalance(null);
        setLamports(null);
        setSlot(null);
        setTokenBalance(null);
        setTokenAmount(null);
        setTokenBalanceString(null);
        setTokenDecimals(null);
        setScannedWalletAddress(null);
      })
      .finally(() => {
        if (activeScan.current === controller) {
          activeScan.current = null;
          setIsScanning(false);
        }
      });
  }, [walletAddress]);

  useEffect(() => {
    scan();
    return () => activeScan.current?.abort();
  }, [scan]);

  useEffect(() => {
    if (!walletAddress) return;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") scan();
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [scan, walletAddress]);

  const hasCurrentResult = Boolean(walletAddress && scannedWalletAddress === walletAddress);
  const currentError =
    walletAddress && errorState?.walletAddress === walletAddress ? errorState.message : null;

  return {
    error: currentError,
    isScanning,
    lamports: hasCurrentResult ? lamports : null,
    rescan: scan,
    slot: hasCurrentResult ? slot : null,
    solBalance: hasCurrentResult ? solBalance : null,
    tokenAmount: hasCurrentResult ? tokenAmount : null,
    tokenBalance: hasCurrentResult ? tokenBalance : null,
    tokenBalanceString: hasCurrentResult ? tokenBalanceString : null,
    tokenDecimals: hasCurrentResult ? tokenDecimals : null,
    walletAddress: walletAddress ?? null,
  };
}
