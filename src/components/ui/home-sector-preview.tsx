"use client";

import {
  Crown,
  Dices,
  Flame,
  HandCoins,
  Landmark,
  LayoutGrid,
  Link2,
  ScrollText,
  Search,
  Store,
  Trophy,
} from "lucide-react";
import { type CSSProperties, useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./home-sector-preview.module.scss";

/* S4: a preview of the planned GameFi sector (ADR 0007): catalogue item art, the Dirtycoin
   visual language, skeletons where content does not exist yet. Nothing here is interactive. All visible labels are provisional owner copy
   (docs/specs/home.md, S4). */

const HEADING = "Next in the Trenches";
const LEDE =
  "GameFi with a player-backed house and thousands of NFTs. Players set the emission and fund the prize pools. Every bet settles onchain.";
const DISCLAIMER = "These are high-risk assets. By investing, you may lose your funds.";

const RAIL = [
  { label: "Dashboard", Icon: LayoutGrid },
  { label: "GameFi", Icon: Dices },
  { label: "HQ", Icon: Crown },
  { label: "House", Icon: Landmark },
  { label: "Shop", Icon: Store },
  { label: "Leaderboard", Icon: Trophy },
  { label: "Pawnshop", Icon: HandCoins },
  { label: "Receipts", Icon: ScrollText },
] as const;

const CHIPS = ["Hot", "Slots", "Table games", "Plinko & Keno", "Strategy"] as const;

const ARCADE = ["glock18", "weapon-case", "briefcase", "to-the-moon-visa", "bitcoin", "ethereum"];

const SECTIONS = [
  { title: "House", art: "briefcase" },
  { title: "HQ", art: null },
  { title: "Pawnshop", art: "weapon-case" },
  { title: "Shop", art: "to-the-moon-visa" },
  { title: "Leaderboard", art: "bitcoin" },
] as const;

const FEED_TABS = ["All bets", "Biggest wins 30d", "Biggest wins all time"] as const;

/** Design width of the window follows the box (so small stages are not shrunk to nothing);
    its height follows the box's proportions so the shot fills it. */
const MIN_DESIGN_WIDTH = 420;
const MAX_DESIGN_WIDTH = 860;
/** The tilted window covers its box and runs just past the sides and bottom. */
const BLEED_X = 1.06;
const BLEED_Y = 1.05;

function Cover({ id, className }: { id: string; className?: string }) {
  return (
    <img
      className={className}
      src={`/marketplace/${id}/cover.webp`}
      alt=""
      loading="lazy"
      decoding="async"
      width={556}
      height={384}
    />
  );
}

function Bar({ width, className = "" }: { width: string; className?: string }) {
  return <span className={`${styles.bar} ${className}`} style={{ width }} />;
}

function SectionBody({ section }: { section: (typeof SECTIONS)[number] }) {
  return (
    <>
      <span className={styles.sectionCopy}>
        <span className={styles.sectionTitle}>{section.title}</span>
        <Bar width="78%" />
        <Bar width="54%" />
        <span className={styles.soon}>Soon</span>
      </span>
      {section.art ? (
        <Cover id={section.art} className={styles.sectionArt} />
      ) : (
        <span className={styles.nftWall} aria-hidden="true">
          {Array.from({ length: 84 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative grid.
            <i key={index} />
          ))}
        </span>
      )}
    </>
  );
}

export default function HomeSectorPreview() {
  const boxRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLElement>(null);
  const [design, setDesign] = useState({ width: MAX_DESIGN_WIDTH, height: 560 });
  const [scale, setScale] = useState(1);
  const headingId = useId();

  // The design takes the box's proportions (taller on portrait stages); then the scale is read
  // back from the tilted shot's real bounds so it covers the box with a small overshoot.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const shot = windowRef.current;
    if (!box || !shot) return;
    const measure = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!width || !height) return;
      const nextWidth = Math.round(Math.min(MAX_DESIGN_WIDTH, Math.max(MIN_DESIGN_WIDTH, width)));
      const nextHeight = Math.round(Math.min(1500, Math.max(480, (nextWidth * height) / width)));
      shot.style.width = `${nextWidth}px`;
      shot.style.height = `${nextHeight}px`;
      setDesign({ width: nextWidth, height: nextHeight });
      let current = Number(shot.style.getPropertyValue("--fit")) || 1;
      for (let pass = 0; pass < 3; pass += 1) {
        shot.style.setProperty("--fit", String(current));
        const rect = shot.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const next =
          current * Math.max((width * BLEED_X) / rect.width, (height * BLEED_Y) / rect.height);
        if (Math.abs(next - current) < 0.002) break;
        current = next;
      }
      setScale(current);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    measure();
    return () => observer.disconnect();
  }, []);

  const narrow = design.width < 560;
  const arcade = ARCADE.slice(0, narrow ? 3 : design.width < 640 ? 4 : 5);

  return (
    <section className={styles.frame} aria-labelledby={headingId}>
      <header className={styles.head}>
        <h2
          id={headingId}
          className={styles.heading}
          data-sc={3}
          data-fx="clip"
          data-d={0.05}
          style={{ opacity: 0 }}
        >
          {HEADING}
        </h2>
        <p className={styles.lede} data-sc={3} data-fx="rise" data-d={0.15} style={{ opacity: 0 }}>
          {LEDE}
        </p>
      </header>

      <div
        ref={boxRef}
        className={styles.box}
        data-sc={3}
        data-fx="rise"
        data-d={0.25}
        style={{ opacity: 0 }}
      >
        <figure
          ref={windowRef}
          className={styles.window}
          data-narrow={narrow}
          aria-label="Preview of the planned game sector"
          style={
            {
              width: design.width,
              height: design.height,
              "--fit": scale,
            } as CSSProperties
          }
        >
          <nav className={styles.rail} aria-label="Sector sections (preview)">
            <span className={styles.logo}>
              <img src="/images/dirtycoin-logo.png" alt="" width={34} height={34} />
            </span>
            {RAIL.map(({ label, Icon }) => (
              <span key={label} className={styles.railItem}>
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </span>
            ))}
          </nav>

          <div className={styles.main}>
            <div className={styles.toolbar}>
              <span className={styles.search}>
                <Search size={14} aria-hidden="true" />
                Search GameFi
                <kbd>/</kbd>
              </span>
              <span className={styles.chips}>
                {CHIPS.map((chip, index) => (
                  <span key={chip} className={styles.chip} data-hot={index === 0}>
                    {index === 0 && <Flame size={12} aria-hidden="true" />}
                    {chip}
                  </span>
                ))}
              </span>
            </div>

            <div className={styles.rowHead}>
              <span className={styles.rowTitle}>Arcade</span>
              <span className={styles.soon}>Soon</span>
            </div>
            <div className={styles.arcade}>
              {arcade.map((id) => (
                <span key={id} className={styles.tile}>
                  <Cover id={id} className={styles.tileArt} />
                  <Bar width="62%" className={styles.tileName} />
                </span>
              ))}
            </div>

            <div className={styles.rowHead}>
              <span className={styles.rowTitle}>The sector</span>
            </div>
            <div className={styles.sections}>
              {SECTIONS.map((section) => (
                <span key={section.title} className={styles.section}>
                  <SectionBody section={section} />
                </span>
              ))}
            </div>

            <div className={styles.feed}>
              <div className={styles.feedHead}>
                <span className={styles.rowTitle}>Onchain feed</span>
                <span className={styles.tabs}>
                  {FEED_TABS.map((tab, index) => (
                    <span key={tab} className={styles.tab} data-active={index === 0}>
                      {tab}
                    </span>
                  ))}
                </span>
              </div>
              {Array.from({ length: design.height > 900 ? 6 : 3 }, (_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows.
                <span key={index} className={styles.feedRow}>
                  <span className={styles.avatar} />
                  <Bar width="22%" />
                  <Bar width="30%" />
                  <Bar width="12%" className={styles.push} />
                  <Link2 size={13} className={styles.receipt} aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
        </figure>
      </div>

      <p className={styles.risk} data-sc={3} data-fx="fade" data-d={0.5} style={{ opacity: 0 }}>
        {DISCLAIMER}
      </p>
    </section>
  );
}
