import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ItineraryToolbarProps = {
  onGenerate: () => void;
  onAddDay: () => void;
  className?: string;
};

export function ItineraryToolbar(props: ItineraryToolbarProps) {
  const { onGenerate, onAddDay, className } = props;

  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>
      <Button variant="outline" onClick={onAddDay}>新增一天行程</Button>
      <ShimmerButton onClick={onGenerate}>生成中英文行程单</ShimmerButton>
    </div>
  );
}
