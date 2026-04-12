import { cn } from "@/lib/utils";

export type ItineraryToolbarProps = {
  className?: string;
};

export function ItineraryToolbar(props: ItineraryToolbarProps) {
  const { className } = props;

  return (
    <div className={cn("flex w-full flex-col items-stretch gap-3 lg:w-auto lg:items-end", className)} />
  );
}
