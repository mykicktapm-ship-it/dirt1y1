import type { CSSProperties, ElementType, ReactElement } from "react";

import type { PolymorphicProps } from "@/dc-ui/types/polymorphic";
import { cn } from "@/lib/utils";

import styles from "./typography.module.scss";

export type DCTextVariant =
  | "display-xl"
  | "display-lg"
  | "heading-xl"
  | "heading-lg"
  | "heading-md"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "label-md"
  | "label-sm"
  | "code-sm";

export type DCTextColor = "primary" | "secondary" | "muted" | "accent" | "warning" | "danger";
export type DCTextWeight = "regular" | "medium" | "semibold" | "bold";

interface DCTypographyOwnProps {
  align?: CSSProperties["textAlign"];
  color?: DCTextColor;
  fontSize?: CSSProperties["fontSize"];
  letterSpacing?: CSSProperties["letterSpacing"];
  lineHeight?: CSSProperties["lineHeight"];
  variant?: DCTextVariant;
  weight?: DCTextWeight;
  wrap?: "wrap" | "balance" | "pretty" | "nowrap";
}

export type DCTextProps<Component extends ElementType = "p"> = PolymorphicProps<
  Component,
  DCTypographyOwnProps
>;

export type DCHeadingProps<Component extends ElementType = "h2"> = DCTextProps<Component>;

const weightMap: Record<DCTextWeight, number> = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

type DCTypographyStyle = CSSProperties & {
  "--dc-text-align"?: CSSProperties["textAlign"];
  "--dc-text-letter-spacing"?: CSSProperties["letterSpacing"];
  "--dc-text-line-height"?: CSSProperties["lineHeight"];
  "--dc-text-size"?: CSSProperties["fontSize"];
  "--dc-text-weight"?: number;
  "--dc-text-wrap"?: string;
};

function renderTypography<Component extends ElementType>(
  props: DCTextProps<Component>,
  defaults: { element: ElementType; variant: DCTextVariant },
): ReactElement {
  const {
    as,
    align,
    className,
    color = "primary",
    fontSize,
    letterSpacing,
    lineHeight,
    style,
    variant = defaults.variant,
    weight,
    wrap = "wrap",
    ...elementProps
  } = props;
  const Element = (as ?? defaults.element) as ElementType;
  const typographyStyle: DCTypographyStyle = {
    "--dc-text-align": align,
    "--dc-text-letter-spacing": letterSpacing,
    "--dc-text-line-height": lineHeight,
    "--dc-text-size": fontSize,
    "--dc-text-weight": weight ? weightMap[weight] : undefined,
    "--dc-text-wrap": wrap === "nowrap" ? "nowrap" : wrap,
    ...style,
  };

  return (
    <Element
      className={cn(styles.text, className)}
      data-dc-color={color}
      data-dc-variant={variant}
      style={typographyStyle}
      {...elementProps}
    />
  );
}

export function DCText<Component extends ElementType = "p">(
  props: DCTextProps<Component>,
): ReactElement {
  return renderTypography(props, { element: "p", variant: "body-md" });
}

export function DCHeading<Component extends ElementType = "h2">(
  props: DCHeadingProps<Component>,
): ReactElement {
  return renderTypography(props, { element: "h2", variant: "heading-lg" });
}
