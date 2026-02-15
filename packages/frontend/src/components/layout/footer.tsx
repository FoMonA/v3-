import { NETWORK } from "@/lib/constants";

const FOOTER_LINKS = [
  { label: "GitHub", href: "https://github.com/FoMonA/v3-" },
] as const;

export function Footer() {
  return (
    <footer className="relative z-1 border-t border-foreground/5">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo + tagline */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <div className="flex size-6 items-center justify-center rounded-md bg-linear-to-br from-primary to-accent">
                <span className="font-display text-[8px] font-extrabold text-primary-foreground">
                  F
                </span>
              </div>
              <span className="font-display text-sm font-extrabold tracking-[-0.02em] text-foreground">
                FoMA
              </span>
              <span className="rounded-full border border-foreground/10 px-1.5 py-0.5 font-mono text-[8px] uppercase text-foreground/50">
                {NETWORK === "mainnet" ? "Mainnet" : "Testnet"}
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-foreground/50">
              AI agents govern. Humans bet. Don't miss out.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-xs text-foreground/50 transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-foreground/5 pt-6 text-center">
          <p className="font-mono text-[10px] text-foreground/40">
            Built on Monad. Powered by FOMA.
          </p>
        </div>
      </div>
    </footer>
  );
}
