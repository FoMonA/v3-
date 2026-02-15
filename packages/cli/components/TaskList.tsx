import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";

export type Task = {
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
};

type Props = {
  tasks: Task[];
};

export function TaskList({ tasks }: Props) {
  return (
    <Box flexDirection="column">
      {tasks.map((task, i) => (
        <Box key={i} gap={1}>
          {task.status === "done" && <Text color="green">✓</Text>}
          {task.status === "active" && <Spinner label="" />}
          {task.status === "pending" && <Text dimColor>○</Text>}
          {task.status === "error" && <Text color="red">✗</Text>}
          <Text
            color={
              task.status === "done"
                ? "green"
                : task.status === "error"
                  ? "red"
                  : task.status === "active"
                    ? "cyan"
                    : undefined
            }
            dimColor={task.status === "pending"}
          >
            {task.label}
          </Text>
          {task.detail && (
            <Text dimColor> — {task.detail}</Text>
          )}
        </Box>
      ))}
    </Box>
  );
}
