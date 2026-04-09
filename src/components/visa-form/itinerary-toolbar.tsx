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
    <div className={cn("flex flex-wrap items-center justify-end gap-3", className)}>
      <Button variant="secondary" onClick={onAddDay}>
        新增一天行程
      </Button>
      <Button className="px-5" onClick={onGenerate}>
        生成中英文行程单
      </Button>
    </div>
  );
}
