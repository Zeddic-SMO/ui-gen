import type { FileNode } from "@/lib/file-system";
import { VirtualFileSystem } from "@/lib/file-system";
import { streamText, appendResponseMessages } from "ai";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLanguageModel } from "@/lib/provider";
import { generationPrompt } from "@/lib/prompts/generation";
import { getOrCreateAnonSession } from "@/lib/anon-session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Skip rate limiting for mock provider (development mode)
  const isMockProvider = !process.env.ANTHROPIC_API_KEY;

  if (!isMockProvider) {
    // Get session info
    const session = await getSession();
    const anonSession = await getOrCreateAnonSession();

    // Determine identifier and limit
    const isAuthenticated = !!session;
    const identifier = isAuthenticated
      ? `user:${session.userId}`
      : `anon:${anonSession.id}`;
    const limit = isAuthenticated
      ? RATE_LIMITS.authenticated
      : RATE_LIMITS.anonymous;

    // Check rate limit
    const result = checkRateLimit(identifier, limit);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: isAuthenticated
            ? "You've used all your prompts."
            : "Anonymous users are limited to 2 prompts. Sign up for more!",
          limit: result.limit,
          remaining: 0,
        },
        { status: 429 }
      );
    }
  }

  const {
    messages,
    files,
    projectId,
  }: { messages: any[]; files: Record<string, FileNode>; projectId?: string } =
    await req.json();

  messages.unshift({
    role: "system",
    content: generationPrompt,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  });

  // Reconstruct the VirtualFileSystem from serialized data
  const fileSystem = new VirtualFileSystem();
  fileSystem.deserializeFromNodes(files);

  const model = getLanguageModel();
  const result = streamText({
    model,
    messages,
    maxTokens: 10_000,
    maxSteps: isMockProvider ? 4 : 40,
    onError: (err: any) => {
      console.error(err);
    },
    tools: {
      str_replace_editor: buildStrReplaceTool(fileSystem),
      file_manager: buildFileManagerTool(fileSystem),
    },
    onFinish: async ({ response }) => {
      // Save to project if projectId is provided and user is authenticated
      if (projectId) {
        try {
          // Check if user is authenticated
          const session = await getSession();
          if (!session) {
            console.error("User not authenticated, cannot save project");
            return;
          }

          // Get the messages from the response
          const responseMessages = response.messages || [];
          // Combine original messages with response messages
          const allMessages = appendResponseMessages({
            messages: [...messages.filter((m) => m.role !== "system")],
            responseMessages,
          });

          await prisma.project.update({
            where: {
              id: projectId,
              userId: session.userId,
            },
            data: {
              messages: JSON.stringify(allMessages),
              data: JSON.stringify(fileSystem.serialize()),
            },
          });
        } catch (error) {
          console.error("Failed to save project data:", error);
        }
      }
    },
  });

  return result.toDataStreamResponse();
}

export const maxDuration = 120;
