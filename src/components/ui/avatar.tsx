"use client";

import { cn } from "@/lib/utils";
import { marketplaceSkeletonMasks } from "@/resources/marketplace-skeletons";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";
import { CircleSkeleton, SquareSkeleton } from "./skeleton-shapes";

type LoadingStatus = "idle" | "loading" | "loaded" | "error";
type AvatarSource = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>["src"];
const AvatarLoadingContext = React.createContext<{
  status: LoadingStatus;
  source?: AvatarSource;
  setStatus: (status: LoadingStatus, source?: AvatarSource) => void;
} | null>(null);

function avatarImageSource(children: React.ReactNode): AvatarSource {
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement<{ src?: AvatarSource; children?: React.ReactNode }>(child)) continue;
    if (child.type === AvatarImage && child.props.src) return child.props.src;
    const nestedSource = avatarImageSource(child.props.children);
    if (nestedSource) return nestedSource;
  }
  return undefined;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => {
  const source = avatarImageSource(props.children);
  const [imageState, setImageState] = React.useState<{
    source?: AvatarSource;
    status: LoadingStatus;
  }>({ status: "idle" });
  const status = source
    ? imageState.source === source && imageState.status !== "idle"
      ? imageState.status
      : "loading"
    : "idle";
  const setStatus = React.useCallback((status: LoadingStatus, source?: AvatarSource) => {
    setImageState({ source, status });
  }, []);
  return (
    <AvatarLoadingContext.Provider value={{ status, source, setStatus }}>
      <AvatarPrimitive.Root
        ref={ref}
        className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
        data-site-loading={status === "loading" ? "true" : undefined}
      />
    </AvatarLoadingContext.Provider>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, onLoadingStatusChange, ...props }, ref) => {
  const loading = React.useContext(AvatarLoadingContext);
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
      onLoadingStatusChange={(status) => {
        loading?.setStatus(status, props.src);
        onLoadingStatusChange?.(status);
      }}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  const loading = React.useContext(AvatarLoadingContext);
  const marketItem =
    typeof loading?.source === "string"
      ? loading.source.match(/^\/marketplace\/([a-z0-9-]+)\/cover\.webp$/)?.[1]
      : undefined;
  const mask = marketItem ? marketplaceSkeletonMasks[marketItem] : undefined;
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className,
        loading?.status === "loading" && mask && "bg-transparent",
      )}
      {...props}
    >
      {loading?.status === "loading" ? (
        mask ? (
          <SquareSkeleton
            as="span"
            className="h-full w-full"
            style={{
              maskImage: `url("${mask}")`,
              WebkitMaskImage: `url("${mask}")`,
              maskSize: "cover",
              WebkitMaskSize: "cover",
              maskPosition: "center",
              WebkitMaskPosition: "center",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
            }}
          />
        ) : (
          <CircleSkeleton as="span" className="h-full w-full" />
        )
      ) : (
        children
      )}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
