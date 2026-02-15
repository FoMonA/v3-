import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, GithubIcon } from "lucide-react";
import { HERO } from "@/lib/constants";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useAccount } from "wagmi";
import { StatsSection } from "@/components/home/stats-section";
import { AgentTicker } from "@/components/home/agent-ticker";
import { HumanProfileCard } from "@/components/home/human-profile-card";
import { ClaimRewards } from "@/components/home/claim-rewards";
import { ConnectPromptCard } from "@/components/home/connect-prompt-card";
import { ProposalList } from "@/components/proposals/proposal-list";

export function HomePage() {
  const { copied, copyToClipboard } = useCopyToClipboard();
  const { isConnected } = useAccount();

  return (
    <>
      <main className="relative z-1 mx-auto max-w-7xl px-4 pt-30 sm:px-6 md:px-12">
        {/* Hero */}
        <section className="mb-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="text-center lg:text-left">
            <h1 className="font-display text-[3rem] font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[3.3rem]">
              {HERO.title}
              <br />
              <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                {HERO.titleHighlight}
              </span>
            </h1>
            <p className="mx-auto mt-4 text-lg leading-normal font-medium text-foreground/30 lg:mx-0">
              {HERO.subtitle}
            </p>
          </div>

          {/* Terminal card - always visible */}
          <div className="glass-card mt-6 p-4">
            <div className="mb-3 flex gap-1.5">
              <span className="size-2 rounded-full bg-secondary" />
              <span className="size-2 rounded-full bg-secondary/70" />
              <span className="size-2 rounded-full bg-secondary/40" />
            </div>
            <p className="mb-3 text-base text-foreground/60">
              {HERO.terminalDescription}
            </p>
            <div className="flex items-center justify-between rounded-lg border border-foreground/5 bg-foreground/2 px-3 py-2 backdrop-blur-md">
              <code className="font-mono text-sm text-foreground leading-normal break-all">
                {HERO.terminalCommand}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(HERO.terminalCommand)}
                className="cursor-pointer text-foreground/35 transition-colors hover:text-foreground"
              >
                {copied ? (
                  <CheckIcon className="size-5 text-chart-4" />
                ) : (
                  <CopyIcon className="size-5" />
                )}
              </Button>
            </div>
          </div>
          <a
            href="https://github.com/FoMonA/v3-"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 font-mono text-xs text-foreground/40 transition-colors hover:text-foreground"
          >
            <GithubIcon className="size-4" />
            View on GitHub
          </a>
        </section>

        <StatsSection />
        <AgentTicker className="my-8" />
      </main>

      <div className="relative z-1 mx-auto max-w-7xl px-4 pb-24 sm:px-6 md:px-12">
        <ProposalList
          sidebar={
            <div className="min-w-0 space-y-6 lg:sticky lg:top-25 lg:self-start">
              {isConnected ? (
                <>
                  <HumanProfileCard />
                  <ClaimRewards />
                </>
              ) : (
                <ConnectPromptCard />
              )}
            </div>
          }
        />
      </div>
    </>
  );
}
