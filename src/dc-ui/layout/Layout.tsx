import type { CSSProperties, ElementType, ReactElement } from "react";

import type { PolymorphicProps } from "@/dc-ui/types/polymorphic";
import { cn } from "@/lib/utils";

import styles from "./layout.module.scss";

export type DCSpaceToken =
  | "0"
  | "2"
  | "4"
  | "8"
  | "12"
  | "16"
  | "20"
  | "24"
  | "32"
  | "40"
  | "48"
  | "64"
  | "80";

export type DCSpace = DCSpaceToken | number;
export type DCDirection = "row" | "row-reverse" | "column" | "column-reverse";
export type DCAxisAlignment =
  | "start"
  | "center"
  | "end"
  | "stretch"
  | "baseline"
  | "between"
  | "around"
  | "evenly";

type DCDisplay = "block" | "flex" | "grid" | "inline-flex" | "none";
type CSSVariableName = `--dc-${string}`;
type DCStyle = CSSProperties & Partial<Record<CSSVariableName, string | number>>;

export interface DCResponsiveLayout {
  direction?: DCDirection;
  horizontal?: DCAxisAlignment;
  vertical?: DCAxisAlignment;
  gap?: DCSpace;
  wrap?: CSSProperties["flexWrap"];
  columns?: number | string;
  hide?: boolean;
}

interface DCBoxOwnProps {
  fill?: boolean;
  fillWidth?: boolean;
  fillHeight?: boolean;
}

interface DCLayoutOwnProps extends DCBoxOwnProps, DCResponsiveLayout {
  center?: boolean;
  padding?: DCSpace;
  paddingX?: DCSpace;
  paddingY?: DCSpace;
  margin?: DCSpace;
  marginX?: DCSpace;
  marginY?: DCSpace;
  s?: DCResponsiveLayout;
  m?: DCResponsiveLayout;
  l?: DCResponsiveLayout;
}

export type DCBoxProps<Component extends ElementType = "div"> = PolymorphicProps<
  Component,
  DCBoxOwnProps
>;

export type DCLayoutProps<Component extends ElementType = "div"> = PolymorphicProps<
  Component,
  DCLayoutOwnProps
>;

export type DCGridProps<Component extends ElementType = "div"> = DCLayoutProps<Component>;

const alignmentMap: Record<DCAxisAlignment, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

function space(value?: DCSpace): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}rem` : `var(--dc-space-${value})`;
}

function getAxes(
  direction: DCDirection,
  horizontal?: DCAxisAlignment,
  vertical?: DCAxisAlignment,
): Pick<DCStyle, "alignItems" | "justifyContent"> {
  const isColumn = direction.startsWith("column");

  return {
    alignItems: isColumn
      ? horizontal && alignmentMap[horizontal]
      : vertical && alignmentMap[vertical],
    justifyContent: isColumn
      ? vertical && alignmentMap[vertical]
      : horizontal && alignmentMap[horizontal],
  };
}

function gridColumns(columns?: number | string): string | undefined {
  if (typeof columns === "number") {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }
  return columns;
}

function setResponsiveVariables(
  target: DCStyle,
  breakpoint: "s" | "m" | "l",
  responsive: DCResponsiveLayout | undefined,
  fallbackDirection: DCDirection,
): void {
  if (!responsive) return;

  const direction = responsive.direction ?? fallbackDirection;
  const axes = getAxes(direction, responsive.horizontal, responsive.vertical);

  target[`--dc-${breakpoint}-display`] = responsive.hide ? "none" : "var(--dc-display)";
  target[`--dc-${breakpoint}-direction`] = direction;
  target[`--dc-${breakpoint}-wrap`] = responsive.wrap;
  target[`--dc-${breakpoint}-align`] = axes.alignItems;
  target[`--dc-${breakpoint}-justify`] = axes.justifyContent;
  target[`--dc-${breakpoint}-gap`] = space(responsive.gap);
  target[`--dc-${breakpoint}-grid-columns`] = gridColumns(responsive.columns);
}

function layoutStyle(
  props: DCLayoutOwnProps,
  defaults: { display: DCDisplay; direction: DCDirection },
): DCStyle {
  const direction = props.direction ?? defaults.direction;
  const axes = props.center
    ? { alignItems: "center", justifyContent: "center" }
    : getAxes(direction, props.horizontal, props.vertical);
  const result: DCStyle = {
    "--dc-display": props.hide ? "none" : defaults.display,
    "--dc-direction": direction,
    "--dc-wrap": props.wrap,
    "--dc-align": axes.alignItems,
    "--dc-justify": axes.justifyContent,
    "--dc-gap": space(props.gap),
    "--dc-grid-columns": gridColumns(props.columns),
    width: props.fill || props.fillWidth ? "100%" : undefined,
    height: props.fill || props.fillHeight ? "100%" : undefined,
    padding: space(props.padding),
    paddingInline: space(props.paddingX),
    paddingBlock: space(props.paddingY),
    margin: space(props.margin),
    marginInline: space(props.marginX),
    marginBlock: space(props.marginY),
  };

  setResponsiveVariables(result, "l", props.l, direction);
  setResponsiveVariables(result, "m", props.m, direction);
  setResponsiveVariables(result, "s", props.s, direction);

  return result;
}

export function DCBox<Component extends ElementType = "div">({
  as,
  className,
  fill,
  fillWidth,
  fillHeight,
  style,
  ...props
}: DCBoxProps<Component>): ReactElement {
  const Element = (as ?? "div") as ElementType;

  return (
    <Element
      className={cn(styles.box, className)}
      style={{
        width: fill || fillWidth ? "100%" : undefined,
        height: fill || fillHeight ? "100%" : undefined,
        ...style,
      }}
      {...props}
    />
  );
}

function renderLayout<Component extends ElementType>(
  props: DCLayoutProps<Component>,
  defaults: { display: DCDisplay; direction: DCDirection; grid?: boolean },
): ReactElement {
  const {
    as,
    className,
    style,
    fill,
    fillWidth,
    fillHeight,
    direction,
    horizontal,
    vertical,
    center,
    gap,
    wrap,
    columns,
    hide,
    padding,
    paddingX,
    paddingY,
    margin,
    marginX,
    marginY,
    s,
    m,
    l,
    ...elementProps
  } = props;
  const Element = (as ?? "div") as ElementType;
  const ownProps: DCLayoutOwnProps = {
    fill,
    fillWidth,
    fillHeight,
    direction,
    horizontal,
    vertical,
    center,
    gap,
    wrap,
    columns,
    hide,
    padding,
    paddingX,
    paddingY,
    margin,
    marginX,
    marginY,
    s,
    m,
    l,
  };

  return (
    <Element
      className={cn(styles.box, defaults.grid ? styles.grid : styles.layout, className)}
      style={{ ...layoutStyle(ownProps, defaults), ...style }}
      {...elementProps}
    />
  );
}

export function DCStack<Component extends ElementType = "div">(
  props: DCLayoutProps<Component>,
): ReactElement {
  return renderLayout(props, { display: "flex", direction: "column" });
}

export function DCRow<Component extends ElementType = "div">(
  props: DCLayoutProps<Component>,
): ReactElement {
  return renderLayout(props, { display: "flex", direction: "row" });
}

export function DCGrid<Component extends ElementType = "div">(
  props: DCGridProps<Component>,
): ReactElement {
  return renderLayout(props, { display: "grid", direction: "row", grid: true });
}
