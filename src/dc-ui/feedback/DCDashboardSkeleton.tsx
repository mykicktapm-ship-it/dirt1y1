import { Wallet } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import aboutStyles from "@/components/about/about.module.scss";
import dashboardStyles from "@/components/about/dashboard-view.module.scss";
import inventoryStyles from "@/components/inventory.module.scss";
import glassButtonStyles from "@/components/ui/glass-button.module.scss";
import type { CommunityFeedPost, CommunityVideoNote } from "@/components/ui/notifications-menu";
import { cn } from "@/lib/utils";
import { marketplaceItems } from "@/resources/marketplace";
import { marketplaceSkeletonMasks } from "@/resources/marketplace-skeletons";
import { skeletonBackground } from "./DCSkeleton";
import styles from "./dashboard-skeleton.module.scss";

export type DCDashboardSkeletonProps = {
  posts?: CommunityFeedPost[];
  videoNote?: CommunityVideoNote;
};

function Text({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn(styles.text, className)}>{children}</span>;
}

/** Account hero: name and wallet button, wallet line, the dot-matrix balance figure. */
function AccountSkeleton() {
  return (
    <div className="grid gap-3 text-left">
      <div className="flex items-center justify-between gap-4">
        <span className="text-2xl font-extrabold leading-tight">
          <Text>User</Text>
        </span>
        <span className={glassButtonStyles.glassButtonWrap}>
          <span className={cn(glassButtonStyles.glassButton, styles.walletControl)}>
            <span className={cn(glassButtonStyles.glassButtonText, glassButtonStyles.sizeSm)}>
              <span className={cn(styles.shape, styles.walletControlIcon)}>
                <Wallet aria-hidden="true" size={16} />
              </span>
              <Text className={styles.walletControlLabel}>Connect</Text>
            </span>
          </span>
        </span>
      </div>
      <span className="text-sm">
        <Text>Wallet not connected</Text>
      </span>
      <span className={cn(styles.shape, styles.figure)} />
    </div>
  );
}

/** Inventory stage: the catalogue items as silhouettes (their own cover masks). */
function InventorySkeleton() {
  return (
    <section className={inventoryStyles.inventory}>
      <div className={inventoryStyles.head}>
        <span className={inventoryStyles.title}>
          <Text>Inventory</Text>
        </span>
        <span className={inventoryStyles.preview}>
          <Text>Preview</Text>
        </span>
      </div>
      <ul className={inventoryStyles.grid}>
        {marketplaceItems.map((item) => (
          <li key={item.id} className={inventoryStyles.tile} data-skeleton-inventory-item={item.id}>
            <span
              className={cn(styles.shape, styles.itemMask, styles.tileMask)}
              style={{
                maskImage: `url("${marketplaceSkeletonMasks[item.id]}")`,
                WebkitMaskImage: `url("${marketplaceSkeletonMasks[item.id]}")`,
              }}
            />
            <span className={inventoryStyles.name}>
              <Text>{item.title}</Text>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Level: heading, level name, tick bar and the five-step ladder. */
function LevelSkeleton() {
  return (
    <div className="grid gap-3">
      <span className="text-lg font-semibold">
        <Text>Level</Text>
      </span>
      <span className="text-3xl">
        <Text>Visitor</Text>
      </span>
      <span className={cn(styles.shape, styles.ticks)} />
      <div className="grid grid-cols-5 gap-1.5">
        {["Visitor", "Holder", "Black Umbrella", "Whale", "Dirty Hand"].map((name) => (
          <span key={name} className="truncate text-xs">
            <Text>{name}</Text>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The collapsed notifications pill in the top-right corner. */
function NotificationsTriggerSkeleton() {
  return <span className={cn(styles.shape, styles.notificationsTrigger)} />;
}

export function DCDashboardSkeleton(_props: DCDashboardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={aboutStyles.page}
      style={{ "--dashboard-skeleton-background": skeletonBackground } as CSSProperties}
    >
      <div className={aboutStyles.layout}>
        <div className={aboutStyles.content}>
          <div className={dashboardStyles.dashboard}>
            <AccountSkeleton />
            <InventorySkeleton />
            <LevelSkeleton />
          </div>
          <NotificationsTriggerSkeleton />
        </div>
      </div>
    </div>
  );
}
