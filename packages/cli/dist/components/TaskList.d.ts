export type Task = {
    label: string;
    status: "pending" | "active" | "done" | "error";
    detail?: string;
};
type Props = {
    tasks: Task[];
};
export declare function TaskList({ tasks }: Props): import("react/jsx-runtime").JSX.Element;
export {};
