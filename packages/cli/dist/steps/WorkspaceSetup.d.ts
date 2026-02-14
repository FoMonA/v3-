type Props = {
    address: string;
    privateKey: string;
    userId: string;
    onComplete: (data: {
        workspacePath: string;
        agentId: string;
    }) => void;
};
export declare function WorkspaceSetup({ address, privateKey, userId, onComplete }: Props): import("react/jsx-runtime").JSX.Element;
export {};
