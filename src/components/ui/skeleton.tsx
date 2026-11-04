import { clsx } from "clsx";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-[#e8f0fa] dark:bg-surface-hover/80 border border-border/30",
        className
      )}
      {...props}
    />
  );
}

