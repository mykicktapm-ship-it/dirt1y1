import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from "react";

type AsProp<Component extends ElementType> = {
  as?: Component;
};

type PropsToOmit<Component extends ElementType, Props> = keyof (AsProp<Component> & Props);

export type PolymorphicProps<
  Component extends ElementType,
  Props = Record<string, never>,
> = PropsWithChildren<Props & AsProp<Component>> &
  Omit<ComponentPropsWithoutRef<Component>, PropsToOmit<Component, Props>>;
