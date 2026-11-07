"use client";

import React, { useMemo } from "react";
import styles from "./PixelBrokeButton.module.scss";

export interface PixelBrokeButtonProps {
  text?: string;
  startIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
}

// ─── Polygon generator ────────────────────────────────────
// Fewer steps = bigger "pixels" along each edge
const H_STEPS = 10; // horizontal: 10 chunks → ~10px per pixel on a 100px button
const V_STEPS = 4;  // vertical:   4 chunks → ~7px  per pixel on a 30px button
const MAX_JITTER = 5; // % jitter — more noticeable with bigger chunks

function rng(seed: number, a: number, b: number): number {
  let h = (seed * 9301 + 49297 + a * 137 + b * 631) % 233280;
  h = (h * 9301 + 49297) % 233280;
  return h / 233280;
}

/** Build a jagged polygon (%) — clockwise. */
function buildClipPath(seed: number): string {
  const hStep = 100 / (H_STEPS - 1);
  const vStep = 100 / (V_STEPS - 1);
  const pts: string[] = [];
  const j = (i: number, axis: number) =>
    ((rng(seed, i, axis) - 0.5) * 2 * MAX_JITTER).toFixed(1);

  for (let i = 0; i < H_STEPS; i++) pts.push(`${(i * hStep).toFixed(1)}% ${j(i,0)}%`);
  for (let i = 1; i < V_STEPS; i++) pts.push(`${(100+parseFloat(j(i,1))).toFixed(1)}% ${(i*vStep).toFixed(1)}%`);
  for (let i = H_STEPS-1; i >= 0; i--) pts.push(`${(i*hStep).toFixed(1)}% ${(100+parseFloat(j(i,2))).toFixed(1)}%`);
  for (let i = V_STEPS-1; i >= 0; i--) pts.push(`${j(i,3)}% ${(i*vStep).toFixed(1)}%`);

  return `polygon(${pts.join(", ")})`;
}

// ─── Debris generator ─────────────────────────────────────
interface Debris {
  id: string; top: string; left: string;
  pixOp: string; flickTo: string; flickDur: string;
  flickDel: string; driftX: string; driftY: string; floatDel: string;
}

function buildDebris(seed: number, count: number): Debris[] {
  const d: Debris[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng(seed, i, 0);
    const side = Math.floor(rng(seed, i, 1) * 4);
    let top: string, left: string;
    const dist = (rng(seed, i, 2) * 14).toFixed(0);
    const pos = (85 + rng(seed, i, 3) * 15).toFixed(0);
    if (side===0)      { top=`-${dist}px`; left=`${pos}%`; }
    else if (side===1) { top=`${pos}%`; left=`calc(100% + ${dist}px)`; }
    else if (side===2) { top=`calc(100% + ${dist}px)`; left=`${pos}%`; }
    else               { top=`${pos}%`; left=`-${dist}px`; }
    d.push({ id:`d-${i}`, top, left,
      pixOp:(0.3+r*0.7).toFixed(2), flickTo:(0.2+r*0.5).toFixed(2),
      flickDur:(2+r*3).toFixed(2), flickDel:(r*2).toFixed(2),
      driftX:`${((r-0.5)*6).toFixed(0)}px`, driftY:`${((r-0.5)*4).toFixed(0)}px`,
      floatDel:(r*3).toFixed(2) });
  }
  return d;
}

// ─── Component ────────────────────────────────────────────
export const PixelBrokeButton: React.FC<PixelBrokeButtonProps> = ({
  text = "Connect",
  startIcon,
  onClick,
  className,
  disabled = false,
}) => {
  const clipPath = useMemo(() => buildClipPath(42), []);
  const debris = useMemo(() => buildDebris(99, 28), []);

  return (
    <button
      type="button"
      className={`${styles.pixelBrokeButton}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      tabIndex={0}
      style={{ "--btn-clip": clipPath } as React.CSSProperties}
    >
      {/* Fill: the actual jagged button body */}
      <span className={styles.pixelFill} aria-hidden="true" />

      {/* Debris: loose floating pixels */}
      {debris.map((d) => (
        <span
          key={d.id}
          className={styles.debris}
          aria-hidden="true"
          style={{
            top: d.top, left: d.left,
            "--pix-op": d.pixOp, "--flick-to": d.flickTo,
            "--flicker-dur": `${d.flickDur}s`, "--flicker-delay": `${d.flickDel}s`,
            "--drift-x": d.driftX, "--drift-y": d.driftY,
            "--float-delay": `${d.floatDel}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Content */}
      <span className={styles.inner}>
        {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
        <span className={styles.text} data-text={text}>
          {text}
        </span>
      </span>
    </button>
  );
};

export default PixelBrokeButton;

