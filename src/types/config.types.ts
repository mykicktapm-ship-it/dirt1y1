import type { NextFontWithVariable } from "next/dist/compiled/@next/font";

export type RoutesConfig = Record<`/${string}`, boolean>;

export interface FontsConfig {
  body: NextFontWithVariable;
  code: NextFontWithVariable;
  heading: NextFontWithVariable;
  label: NextFontWithVariable;
}
