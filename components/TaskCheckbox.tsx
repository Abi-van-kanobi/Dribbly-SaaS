"use client";

import { useTransition } from "react";
import { Check } from "@phosphor-icons/react";
import { toggleTask } from "@/lib/actions/tasks";

export function TaskCheckbox({ taskId, done }: { taskId: string; done: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleTask(taskId, !done))}
      aria-pressed={done}
      aria-label={done ? "Mark task not done" : "Mark task done"}
      className={`mkt-checkbox ${done ? "mkt-checkbox-checked" : ""}`}
    >
      {done && <Check weight="bold" size={11} color="#fff" />}
    </button>
  );
}
