import type { CSSProperties } from "react";
import framing from "../../public/marketplace/viewer/card-framing.json";

type CoverFrame = { alphaBounds: number[]; initialBounds: number[] };
const profiles: Record<string, CoverFrame> = framing.items;

/** Cover and contour use the initial frame of the same camera as the 3D scene. */
export function getMarketplaceCoverStyle(assetId: string): CSSProperties {
  const profile = profiles[assetId];
  if (!profile) return {};
  const width = 220;
  const height = width / framing.aspect;
  const { width: sourceWidth, height: sourceHeight } = framing.source;
  const fit = Math.min(width / sourceWidth, height / sourceHeight);
  const [left, top, right, bottom] = profile.alphaBounds;
  const [targetLeft, targetTop, targetRight, targetBottom] = profile.initialBounds;
  const scale = Math.min(
    ((targetRight - targetLeft) * width) / ((right - left) * fit),
    ((targetBottom - targetTop) * height) / ((bottom - top) * fit),
  );
  const x =
    (100 *
      (((targetLeft + targetRight) / 2 - 0.5) * width -
        scale * ((left + right) / 2 - sourceWidth / 2) * fit)) /
    width;
  const y =
    (100 *
      (((targetTop + targetBottom) / 2 - 0.5) * height -
        scale * ((top + bottom) / 2 - sourceHeight / 2) * fit)) /
    height;
  return {
    transform: `translate(${x}%, ${y}%) scale(${scale})`,
    transformOrigin: "center",
  };
}
