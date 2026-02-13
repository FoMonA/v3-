import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  selected: number; // -1 = All
  onSelect: (categoryId: number) => void;
  className?: string;
}

export function CategoryFilter({
  selected,
  onSelect,
  className,
}: CategoryFilterProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1", className)}>
      <Button
        variant={selected === -1 ? "gradient" : "glass"}
        size="xs"
        onClick={() => onSelect(-1)}
        className="shrink-0 cursor-pointer"
      >
        All
      </Button>

      {CATEGORIES.map((name, index) => (
        <Button
          key={name}
          variant={selected === index ? "gradient" : "glass"}
          size="xs"
          onClick={() => onSelect(index)}
          className="shrink-0 cursor-pointer"
        >
          {name}
        </Button>
      ))}
    </div>
  );
}
