type Props = {
    workspaces: string[];
    workspaceNetworks?: Record<string, string>;
    onUpdate: () => void;
    onNew: () => void;
    onCancel: () => void;
};
export declare function ExistingWorkspace({ workspaces, workspaceNetworks, onUpdate, onNew, onCancel }: Props): import("react/jsx-runtime").JSX.Element;
export {};
