"use client";

import { DCCurrencyText } from "@/dc-ui/typography/DCCurrencyMark";
import { social } from "@/resources";
import { iconLibrary } from "@/resources/icons";
import { changelogVideoNote } from "@/resources/video-note";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  GlassMessage,
  GlassMessageContent,
  GlassMessageList,
  GlassMessageTyping,
} from "./glass-message";
import styles from "./home-game-stepper.module.scss";
import { VideoNoteCircle } from "./notifications-menu";

/* S3 "How it works": heading, a glass chat (an llms.txt brief from $Dirtycoin, then the pinned
   video note), four steps and the risk line. The umbrella sits as the chat's avatar: the scene
   loop flies it to `data-umbrella-step-anchor`. No prices, fees or computed figures. */

const STEPS = [
  {
    title: "Load up on USDC",
    body: "Grab USDC on Pump.fun. That's United States Dirty Coin, not the bank kind.",
  },
  {
    title: "Pick your bag",
    body: "Every item is its own coin, priced in USDC. Glock, ParaPactum, whichever bag you want to hold.",
  },
  {
    title: "Ride the curve",
    body: "Each buy pushes the price up the bonding curve. Once the curve fills, the item graduates to PumpSwap and keeps trading there.",
  },
  {
    title: "Farm the drop",
    body: "Every trade in the seven items counts toward the NFT airdrop.",
  },
] as const;

/** Owner-requested chat in place of the curve: an LLM brief, then the pinned video note. */
/** Earlier messages from the crowd, oldest first; they run off the top of the scene. */
const HISTORY = [
  "REVOLUTION RN 💀🏰⚔️",
  "bought Bitcoin with USDC with SOL. three layers deep rn",
] as const;

const DISCLAIMER = "These are high-risk assets. By investing, you may lose your funds.";

const LLM_MESSAGE =
  "ser, don't trust us. DYOR with your own AI: drop our llms.txt in and let it read the Pump.fun contracts and the curve. No custom contract, nothing to rig.";

/** Third message; the chats are shown as network logos, not as a link. Provisional copy. */
const CHATS_MESSAGE = "more three-layers-deep people in our chats. you'll fit in.";

/**
 * The thread plays out while the visitor stays on S3: typing, then the llms.txt message, typing,
 * the video note, typing, the chats message. History above is static.
 */
const STEP_DELAYS_MS = [3000, 4500, 5000] as const;

/** Copies `/llms.txt` to the clipboard and says so on the button for a moment. */
function CopyLlmsButton() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      const response = await fetch("/llms.txt");
      if (!response.ok) throw new Error("llms.txt unavailable");
      await navigator.clipboard.writeText(await response.text());
      setState("copied");
    } catch {
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  };

  return (
    <button type="button" className={styles.llmsLink} data-state={state} onClick={copy}>
      {state === "copied" ? (
        <>
          copied <Check size={11} aria-hidden="true" />
        </>
      ) : state === "failed" ? (
        "copy failed"
      ) : (
        <>
          llms.txt <Copy size={11} aria-hidden="true" />
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {state === "copied"
          ? "llms.txt copied to clipboard"
          : state === "failed"
            ? "Copy failed"
            : ""}
      </span>
    </button>
  );
}

export default function HomeGameStepper() {
  const [active, setActive] = useState(0);
  const [sent, setSent] = useState(0);
  const frameRef = useRef<HTMLElement>(null);

  // Send the next scripted message once the visitor has stayed on this scene long enough.
  useEffect(() => {
    if (sent >= STEP_DELAYS_MS.length) return;
    let shownFor = 0;
    const step = 250;
    const wait = STEP_DELAYS_MS[sent];
    const timer = window.setInterval(() => {
      const frame = frameRef.current;
      const onScene = frame && !frame.closest("[inert]") && !document.hidden;
      if (onScene) shownFor += step;
      if (shownFor >= wait) {
        window.clearInterval(timer);
        setSent((count) => count + 1);
      }
    }, step);
    return () => window.clearInterval(timer);
  }, [sent]);

  return (
    <section ref={frameRef} className={styles.frame} aria-label="How it works">
      <div className={styles.chat} data-sc={2} data-fx="rise" data-d={0.2} style={{ opacity: 0 }}>
        <GlassMessageList aria-live="off">
          {HISTORY.map((text) => (
            <GlassMessage key={text} from="user">
              <GlassMessageContent>
                <DCCurrencyText value={text} />
              </GlassMessageContent>
            </GlassMessage>
          ))}
          {sent >= 1 && (
            <div className={styles.arrive}>
              <GlassMessage
                name="$Dirtycoin"
                avatar={
                  // The umbrella lands here: the scene camera flies it to this anchor.
                  <span className={styles.umbrellaAvatar} data-umbrella-step-anchor="" />
                }
              >
                <GlassMessageContent>
                  {LLM_MESSAGE} <CopyLlmsButton />
                </GlassMessageContent>
              </GlassMessage>
            </div>
          )}
          {sent >= 2 && (
            <div className={styles.arrive}>
              <GlassMessage from="user">
                <VideoNoteCircle
                  note={changelogVideoNote}
                  sizeClassName="size-[min(11.5rem,23cqh)]"
                />
              </GlassMessage>
            </div>
          )}
          {sent >= 3 && (
            <div className={styles.arrive}>
              <GlassMessage name="$Dirtycoin" avatar="/images/dirtycoin-logo.png">
                <GlassMessageContent>
                  {CHATS_MESSAGE}
                  <span className={styles.networks} role="img" aria-label="Telegram, X, Discord">
                    {social
                      .filter((network) => network.name !== "Pump.fun")
                      .map((network) => {
                        const Icon = iconLibrary[network.icon];
                        return Icon ? <Icon key={network.name} aria-hidden="true" /> : null;
                      })}
                  </span>
                </GlassMessageContent>
              </GlassMessage>
            </div>
          )}
          {sent < STEP_DELAYS_MS.length && <GlassMessageTyping />}
        </GlassMessageList>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className={styles.step}
            data-active={active === index}
            data-sc={2}
            data-fx="rise"
            data-d={0.35 + index * 0.06}
            style={{ opacity: 0 }}
          >
            <button
              type="button"
              className={styles.stepButton}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setActive(index);
              }}
            >
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.stepTitle}>
                <DCCurrencyText value={step.title} />
              </span>
            </button>
            <p className={styles.stepBody}>
              <DCCurrencyText value={step.body} />
            </p>
          </li>
        ))}
      </ol>

      <p className={styles.risk} data-sc={2} data-fx="fade" data-d={0.6} style={{ opacity: 0 }}>
        {DISCLAIMER}
      </p>
    </section>
  );
}
