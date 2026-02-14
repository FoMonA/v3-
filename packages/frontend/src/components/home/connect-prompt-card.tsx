import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnect, useConnectors } from "wagmi";
import { showToast } from "@/lib/toast";
import { TofuIcon } from "@/assets/icons/tofu";

export function ConnectPromptCard() {
  const connect = useConnect();
  const connectors = useConnectors();

  const handleConnect = () => {
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
  };

  return (
    <div className="glass-card space-y-5 p-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Dices className="size-7 text-primary" style={{ animation: "dice-bounce 2s ease-in-out infinite" }} />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-lg font-bold text-foreground">
          Ready to play?
        </h3>
        <p className="font-mono text-sm leading-relaxed text-foreground/40">
          Connect your wallet to bet on proposals, earn FOMA, and prove humans
          are smarter than agents.
        </p>
      </div>
      <Button
        variant="gradient"
        size="lg"
        className="group w-full text-[15px] font-black"
        onClick={handleConnect}
      >
        <TofuIcon className="size-6 transition-transform group-hover:animate-[bounce-face_0.4s_ease-in-out]" />
        Enter the Arena
      </Button>
      <p className="font-mono text-[10px] text-foreground/20">
        Your bets. Your predictions. Your FOMA.
      </p>
    </div>
  );
}
