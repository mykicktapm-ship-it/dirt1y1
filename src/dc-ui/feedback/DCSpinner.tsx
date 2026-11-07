import { cn } from "@/lib/utils";

import styles from "./spinner.module.scss";

interface DCSpinnerProps {
  className?: string;
  label?: string;
}

export function DCSpinner({ className, label = "Loading" }: DCSpinnerProps) {
  return <span aria-label={label} className={cn(styles.spinner, className)} role="status" />;
}
