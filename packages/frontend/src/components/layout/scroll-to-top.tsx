import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const viewportHeight = window.innerHeight || 0;
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || 0;
      const documentHeight = document.documentElement.scrollHeight || 0;
      const isLongPage = documentHeight >= viewportHeight * 2;
      setIsVisible(isLongPage && scrollTop >= viewportHeight);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Button
      type="button"
      aria-label="Scroll to top"
      size="icon"
      variant="glass"
      className="fixed bottom-24 right-6 z-40 shadow-lg"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp className="size-4" />
    </Button>
  );
}
