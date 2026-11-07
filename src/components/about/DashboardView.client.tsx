"use client";

import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";

import { Inventory } from "@/components/Inventory.client";
import { BentoCard, Chip, DotNumber, TickBar, cx } from "@/components/market-bento/bento-kit";
import bento from "@/components/market-bento/market-bento.module.scss";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useDCChain } from "@/dc-chain";
import { DCCurrencyMark } from "@/dc-ui/typography/DCCurrencyMark";
import { useWeb3Scanner } from "@/hooks/useWeb3Scanner";
import { USER_TIERS, getTierProgress } from "@/utils/tierSystem";

import styles from "./dashboard-view.module.scss";

/*
 * Dashboard laid out like the item page: the account as the hero (name, wallet, the USDC
 * balance as the dot-matrix figure), the inventory where the item page shows its 3D item,
 * then the Battle Pass level. The wallet is scanned once here.
 */
export function DashboardView() {
  const scan = useWeb3Scanner();

  return (
    <div className={styles.dashboard}>
      <AccountHero scan={scan} />
      <LevelCard scan={scan} />
    </div>
  );
}

type Scan = ReturnType<typeof useWeb3Scanner>;

/** "1234.5678" → "1,234.56" (two decimals, rounded down) for the dot-matrix figure. */
function balanceText(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

function AccountHero({ scan }: { scan: Scan }) {
  const { client } = useDCChain();
  const wallet = useConnectedWallet(client);
  const name = wallet?.account.label?.trim() || "User";
  const address = scan.walletAddress;
  const connected = Boolean(address);
  const balance = connected && !scan.error ? scan.tokenBalanceString : null;
  const loading = connected && !scan.error && balance === null && scan.isScanning;
  // Placeholder shaped like a number, never a zero standing in for "no data".
  const figure = balance ? balanceText(balance) : "——.——";
  const label = balance
    ? `Balance ${balance} USDC`
    : loading
      ? "Balance loading"
      : scan.error
        ? "Balance unavailable"
        : "Balance: —";

  return (
    <BentoCard label={name} tone="bare" className={bento.priceHero}>
      <div className={bento.row}>
        <h1 className={bento.heroTitle}>{name}</h1>
        <WalletConnectButton />
      </div>
      <p className={styles.wallet} title={address ?? undefined}>
        {address ? (
          <>
            <span aria-hidden="true">{`${address.slice(0, 6)}…${address.slice(-6)}`}</span>
            <span className="sr-only">{address}</span>
          </>
        ) : (
          "Wallet not connected"
        )}
      </p>
      <div className={bento.figureRow} aria-busy={loading || undefined}>
        <span className={bento.figure}>
          <DotNumber text={figure} label={label} />
          <span className={bento.figureUnit}>
            <DCCurrencyMark />
          </span>
        </span>
        <span className={bento.figureAside}>
          <span className={bento.muted}>
            {connected && scan.solBalance !== null ? `${scan.solBalance.toFixed(4)} SOL` : "— SOL"}
          </span>
          {!connected && <Chip quiet>Preview</Chip>}
        </span>
      </div>
      <div className={styles.stage}>
        <Inventory />
      </div>
    </BentoCard>
  );
}

/** Battle Pass level from the native SOL balance (public/data/battle-pass.json). */
function LevelCard({ scan }: { scan: Scan }) {
  const connected = Boolean(scan.walletAddress);
  const progress = getTierProgress(connected ? scan.lamports : null);

  return (
    <BentoCard label="Level" tone="bare" className={cx(bento.natural, styles.level)}>
      <h2 className={bento.title}>Level</h2>
      <p className={styles.levelName}>
        {connected ? progress.current.name : "—"}
        <span className={styles.levelNumber}>
          {connected ? `Lv ${progress.current.level}` : ""}
        </span>
      </p>
      <TickBar share={connected ? progress.progress : 0} count={48} height={18} major={8} />
      <p className={styles.levelNext}>
        {connected && progress.next
          ? `${progress.remainingSol.toFixed(2)} SOL to ${progress.next.name}`
          : connected
            ? "Top level"
            : "Wallet not connected"}
      </p>
      <ol className={styles.ladder} aria-label="Levels">
        {USER_TIERS.map((tier) => (
          <li
            key={tier.level}
            data-reached={connected && tier.level <= progress.current.level}
            data-current={connected && tier.level === progress.current.level}
          >
            <span>{tier.name}</span>
            <span className={bento.mono}>{tier.minimumSol} SOL</span>
          </li>
        ))}
      </ol>
    </BentoCard>
  );
}
