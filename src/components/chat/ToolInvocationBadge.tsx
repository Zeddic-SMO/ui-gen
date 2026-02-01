"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: string | Record<string, unknown>;
  state: string;
  result?: unknown;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getDisplayText(toolName: string, args: string | Record<string, unknown>): string {
  try {
    const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;
    const path = parsedArgs.path as string | undefined;
    const filename = path?.split("/").pop() || "file";

    if (toolName === "str_replace_editor") {
      const command = parsedArgs.command as string | undefined;
      switch (command) {
        case "create":
          return `Creating ${filename}`;
        case "str_replace":
          return `Editing ${filename}`;
        case "insert":
          return `Editing ${filename}`;
        case "view":
          return `Viewing ${filename}`;
        default:
          return `Modifying ${filename}`;
      }
    }

    if (toolName === "file_manager") {
      const command = parsedArgs.command as string | undefined;
      switch (command) {
        case "rename":
          return `Renaming ${filename}`;
        case "delete":
          return `Deleting ${filename}`;
        default:
          return `Managing ${filename}`;
      }
    }

    return toolName;
  } catch {
    return toolName;
  }
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const displayText = getDisplayText(toolInvocation.toolName, toolInvocation.args);
  const isComplete = toolInvocation.state === "result" && toolInvocation.result !== undefined;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{displayText}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{displayText}</span>
        </>
      )}
    </div>
  );
}
