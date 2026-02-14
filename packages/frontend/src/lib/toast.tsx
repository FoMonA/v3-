import { type ReactNode } from "react";
import { toast } from "sonner";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";

type ToastVariant = "error" | "success" | "warning" | "info";

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: ReactNode; iconClass: string }
> = {
  error: {
    icon: <TriangleAlert className="size-4" />,
    iconClass: "bg-destructive/15 text-destructive",
  },
  success: {
    icon: <CircleCheck className="size-4" />,
    iconClass: "bg-chart-4/15 text-chart-4",
  },
  warning: {
    icon: <TriangleAlert className="size-4" />,
    iconClass: "bg-chart-5/15 text-chart-5",
  },
  info: {
    icon: <Info className="size-4" />,
    iconClass: "bg-accent/15 text-accent",
  },
};

// Call this function to show a toast notification
export function showToast(
  variant: ToastVariant,
  title: string,
  description: string,
) {
  const config = VARIANT_CONFIG[variant];

  toast.custom(() => (
    <div className="glass-toast">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-md ${config.iconClass}`}
      >
        {config.icon}
      </div>
      <div>
        <div className="font-display text-sm font-bold text-primary">
          {title}
        </div>
        <div className="mt-0.5 font-body text-sm text-foreground">
          {description}
        </div>
      </div>
    </div>
  ));
}
