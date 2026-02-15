type WalletData = {
    address: string;
    privateKey: string;
    userId: string;
};
type Props = {
    onComplete: (data: WalletData) => void;
};
export declare function WalletSetup({ onComplete }: Props): import("react/jsx-runtime").JSX.Element;
export {};
