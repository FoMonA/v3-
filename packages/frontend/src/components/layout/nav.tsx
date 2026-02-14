import { Copy, LogOut } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useConnectors } from "wagmi";
import { cn, truncateAddress } from "@/lib/utils";
import { NETWORK } from "@/lib/constants";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TofuIcon } from "@/assets/icons/tofu";

export function Nav() {
  const { address, isConnected } = useAccount();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const connectors = useConnectors();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl">
      <div className="mx-auto flex h-[100px] max-w-7xl items-center justify-between px-4 sm:px-6 md:px-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex size-8 items-center justify-center rounded-md bg-linear-to-br from-primary to-accent">
            <span className="font-display text-xs font-extrabold text-primary-foreground">
              F
            </span>
          </div>
          {/* Mobile: stack vertically / sm+: row with badge after name */}
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="font-display text-lg font-extrabold leading-none tracking-[-0.02em] text-foreground">
              FoMA
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase leading-none tracking-wider",
                NETWORK === "mainnet"
                  ? "border border-chart-4/30 bg-chart-4/10 text-chart-4"
                  : "border border-chart-5/30 bg-chart-5/10 text-chart-5",
              )}
            >
              {NETWORK === "mainnet" ? "Mainnet" : "Testnet"}
            </span>
          </div>
        </div>

        {/* Nav link - smooth scroll to proposals */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:inline-flex font-semibold text-muted-foreground"
          onClick={() =>
            document
              .getElementById("proposals")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Proposals
        </Button>

        {/* Connect / Account */}
        {isConnected ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="lg" className="rounded-xl font-mono text-base">
                <span className="size-2 rounded-full bg-chart-4 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                {address && truncateAddress(address)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  if (address) navigator.clipboard.writeText(address);
                }}
              >
                Copy Address
                <Copy className="ml-auto size-4" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => disconnect.mutate()}>
                Disconnect
                <LogOut className="ml-auto size-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="gradient"
            size="lg"
            className="group text-[15px] font-black"
            onClick={() => {
              if (!window.ethereum) {
                showToast(
                  "error",
                  "No wallet detected",
                  "Install MetaMask or another browser wallet to connect",
                );
                return;
              }
              const connector = connectors[0];
              if (connector) connect.mutate({ connector });
            }}
          >
            <TofuIcon className="size-7 transition-transform group-hover:animate-[bounce-face_0.4s_ease-in-out]" />
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
}
