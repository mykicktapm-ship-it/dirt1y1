"use client";

import { createContext, useContext } from "react";

export type DCLoadingPhase = "brand" | "skeleton" | "ready";
export const DCLoadingContext = createContext<DCLoadingPhase>("ready");

export function useDCLoadingPhase(): DCLoadingPhase {
  return useContext(DCLoadingContext);
}
