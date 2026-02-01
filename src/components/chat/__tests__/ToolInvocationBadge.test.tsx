import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

test("renders 'Creating {filename}' for create command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Counter.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Creating Counter.jsx")).toBeDefined();
});

test("renders 'Editing {filename}' for str_replace command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/components/App.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("renders 'Editing {filename}' for insert command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/utils/helpers.ts" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("renders 'Viewing {filename}' for view command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "view", path: "/index.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Viewing index.tsx")).toBeDefined();
});

test("shows spinner when state is not 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Button.tsx" },
        state: "pending",
      }}
    />
  );

  // Check for the spinner (Loader2 icon with animate-spin class)
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
  expect(spinner).not.toBeNull();
});

test("shows green dot when state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Button.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  // Check for the green dot
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
  expect(greenDot).not.toBeNull();
  // Spinner should not be present
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

test("handles args as JSON string (needs parsing)", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: JSON.stringify({ command: "create", path: "/Card.tsx" }),
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("handles args as object (no parsing needed)", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/Modal.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Editing Modal.tsx")).toBeDefined();
});

test("extracts filename from full path", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/components/ui/Counter.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Creating Counter.jsx")).toBeDefined();
});

test("falls back to tool name if args parsing fails", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: "invalid json {{{",
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("renders 'Renaming {filename}' for file_manager rename command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "file_manager",
        args: { command: "rename", path: "/old-name.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Renaming old-name.tsx")).toBeDefined();
});

test("renders 'Deleting {filename}' for file_manager delete command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "file_manager",
        args: { command: "delete", path: "/temp-file.ts" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Deleting temp-file.ts")).toBeDefined();
});

test("renders 'Modifying {filename}' for unknown str_replace_editor command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "unknown_command", path: "/file.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Modifying file.tsx")).toBeDefined();
});

test("shows spinner during partial/call state", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Button.tsx" },
        state: "call",
      }}
    />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

test("uses 'file' as fallback when path is missing", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Creating file")).toBeDefined();
});
