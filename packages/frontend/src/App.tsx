import { Providers } from "@/providers";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { BackgroundOrbs } from "@/components/layout/orbs";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top";
import { HomePage } from "@/pages/home";
import { Toaster } from "@/components/ui/sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

export function App() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <Providers>
      <BackgroundOrbs />
      <Nav />
      <HomePage />
      <Footer />
      <ScrollToTopButton />
      <Toaster position={isDesktop ? "bottom-right" : "bottom-center"} />
    </Providers>
  );
}
