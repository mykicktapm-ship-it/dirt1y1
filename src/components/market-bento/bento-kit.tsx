"use client";

import {
  type ReactNode,
  type RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./market-bento.module.scss";

/* Shared pieces of the market bento: card shell, segmented control, chip, legend, dot-matrix
   number, tooltip, and motion hooks. Motion respects reduced motion everywhere. */

export const cx = (...names: (string | false | null | undefined)[]) =>
  names.filter(Boolean).join(" ");

export const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** 0 → 1 over `duration` ms each time `key` changes; instant under reduced motion. */
export function useGrow(key: unknown, duration = 1100): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` restarts the animation.
  useEffect(() => {
    if (reduced) {
      setValue(1);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(easeOut(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, reduced, duration]);
  return value;
}

/** Animated number that eases from its previous value to `target`. */
export function useTween(target: number, duration = 900): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = origin + (target - origin) * easeOut(t);
      from.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);
  return value;
}

/** Element width in CSS px, for SVGs that keep text at its natural size. */
export function useWidth<T extends Element>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    setWidth(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export function smoothPath(points: readonly [number, number][], move = true): string {
  if (!points.length) return "";
  let path = `${move ? "M" : "L"}${points[0][0]},${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const k = 0.17;
    path += `C${current[0] + (next[0] - before[0]) * k},${current[1] + (next[1] - before[1]) * k} ${next[0] - (after[0] - current[0]) * k},${next[1] - (after[1] - current[1]) * k} ${next[0]},${next[1]}`;
  }
  return path;
}

/* ---------------------------------- shell ---------------------------------- */

/** `bare` drops surface, frame and shadow: content sits on the page. */
export type CardTone = "hero" | "depth" | "solid" | "glass" | "bare";

export function BentoCard({
  label,
  tone,
  className,
  children,
}: {
  label: string;
  tone: CardTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx(styles.card, styles[tone], className)} aria-label={label}>
      {(tone === "hero" || tone === "depth" || tone === "solid") && (
        <div className={styles.wash} aria-hidden="true" />
      )}
      {(tone === "hero" || tone === "depth") && <div className={styles.core} aria-hidden="true" />}
      <div className={styles.inner}>{children}</div>
      {tone !== "bare" && <div className={styles.rim} aria-hidden="true" />}
    </section>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = [],
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: readonly T[];
}) {
  return (
    <fieldset className={styles.seg} aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          disabled={disabled.includes(option)}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </fieldset>
  );
}

export function Chip({ children, quiet }: { children: ReactNode; quiet?: boolean }) {
  return <span className={cx(styles.chip, quiet && styles.chipQuiet)}>{children}</span>;
}

export function PreviewChip({ show }: { show: boolean }) {
  return show ? <Chip quiet>Preview</Chip> : null;
}

export function Legend({
  items,
  column,
}: {
  items: readonly { label: string; tone: string }[];
  column?: boolean;
}) {
  return (
    <div className={cx(styles.legend, column && styles.legendColumn)}>
      {items.map((item) => (
        <span key={item.label}>
          <span className={cx(styles.swatch, styles[item.tone])} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/* ----------------------------- dot-matrix number ---------------------------- */

const GLYPHS: Record<string, readonly string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ".": ["0", "0", "0", "0", "0", "0", "1"],
  ",": ["0", "0", "0", "0", "0", "1", "1"],
  "—": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  " ": ["00", "00", "00", "00", "00", "00", "00"],
};

/** The bento's dot-matrix figure; `text` is announced through `label`. */
export function DotNumber({
  text,
  label,
  pitch = 7,
}: { text: string; label: string; pitch?: number }) {
  const { dots, columns } = useMemo(() => {
    const on: [number, number][] = [];
    let x = 0;
    for (const char of text) {
      const glyph = GLYPHS[char] ?? GLYPHS[" "];
      const width = glyph[0].length;
      for (let row = 0; row < 7; row += 1) {
        for (let column = 0; column < width; column += 1) {
          if (glyph[row][column] === "1") on.push([x + column, row]);
        }
      }
      x += width + 1;
    }
    return { dots: on, columns: Math.max(1, x - 1) };
  }, [text]);
  const radius = pitch * 0.36;
  return (
    <svg
      className={styles.dots}
      width={columns * pitch}
      height={7 * pitch}
      viewBox={`0 0 ${columns * pitch} ${7 * pitch}`}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: columns * 7 }, (_, index) => {
        const column = Math.floor(index / 7);
        const row = index % 7;
        return (
          <circle
            key={`b${column}-${row}`}
            cx={column * pitch + pitch / 2}
            cy={row * pitch + pitch / 2}
            r={radius * 0.55}
            className={styles.dotOff}
          />
        );
      })}
      {dots.map(([column, row]) => (
        <circle
          key={`d${column}-${row}`}
          cx={column * pitch + pitch / 2}
          cy={row * pitch + pitch / 2}
          r={radius}
          className={styles.dotOn}
          style={{ transitionDelay: `${column * 7}ms` }}
        />
      ))}
    </svg>
  );
}

/* --------------------------------- tooltip --------------------------------- */

type TipRow = readonly [label: string, value: string, tone?: string];
type Tip = { x: number; y: number; title: string; rows: readonly TipRow[] } | null;

const TipContext = createContext<{
  show: (x: number, y: number, title: string, rows: readonly TipRow[]) => void;
  hide: () => void;
}>({ show: () => {}, hide: () => {} });

export const useTip = () => useContext(TipContext);

export function TipLayer({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip>(null);
  const box = useRef<HTMLDivElement>(null);
  const show = useCallback(
    (x: number, y: number, title: string, rows: readonly TipRow[]) => setTip({ x, y, title, rows }),
    [],
  );
  const hide = useCallback(() => setTip(null), []);
  useEffect(() => {
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [hide]);
  useLayoutEffect(() => {
    const node = box.current;
    if (!node || !tip) return;
    const rect = node.getBoundingClientRect();
    let left = tip.x + 16;
    let top = tip.y - rect.height - 14;
    if (left + rect.width > window.innerWidth - 8) left = tip.x - rect.width - 16;
    if (top < 8) top = tip.y + 16;
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
  }, [tip]);
  const value = useMemo(() => ({ show, hide }), [show, hide]);
  return (
    <TipContext.Provider value={value}>
      {children}
      <div ref={box} className={cx(styles.tip, tip && styles.tipOn)} aria-hidden="true">
        {tip && (
          <>
            <div className={styles.tipTitle}>{tip.title}</div>
            {tip.rows.map(([label, value, tone]) => (
              <div key={label} className={styles.tipRow}>
                <span>
                  {tone && <span className={cx(styles.swatch, styles[tone])} />}
                  {label}
                </span>
                <b>{value}</b>
              </div>
            ))}
          </>
        )}
      </div>
    </TipContext.Provider>
  );
}

/* --------------------------------- tick bar -------------------------------- */

/** A row of ticks, the first `share` of them lit; used for runway, goals and progress. */
export function TickBar({
  share,
  count = 36,
  height = 20,
  major = 6,
  delay = 0,
}: {
  share: number;
  count?: number;
  height?: number;
  major?: number;
  delay?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  return (
    <div ref={ref} className={styles.tickBar}>
      {width > 0 && (
        <svg width={width} height={height} aria-hidden="true">
          {Array.from({ length: count }, (_, index) => {
            const x = 1 + (index * (width - 2)) / (count - 1);
            const lit = index / (count - 1) <= share;
            return (
              <line
                key={x}
                x1={x}
                x2={x}
                y1={index % major === 0 ? 0 : height * 0.35}
                y2={height}
                className={lit ? styles.tickOn : styles.tickOff}
                style={{ animationDelay: `${delay + index * 12}ms` }}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
