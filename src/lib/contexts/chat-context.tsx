"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

export interface RateLimitError {
  message: string;
  limit: number;
  remaining: number;
}

interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
  rateLimitError: RateLimitError | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
  } = useAIChat({
    api: "/api/chat",
    initialMessages,
    body: {
      files: fileSystem.serialize(),
      projectId,
    },
    onToolCall: ({ toolCall }) => {
      handleToolCall(toolCall);
    },
    onError: async (error) => {
      // Check if this is a rate limit error (429)
      // The error from useChat includes the response
      if (error.message.includes("Rate limit exceeded")) {
        try {
          // Parse the error message which contains our JSON response
          const match = error.message.match(/\{[\s\S]*\}/);
          if (match) {
            const errorData = JSON.parse(match[0]);
            setRateLimitError({
              message: errorData.message,
              limit: errorData.limit,
              remaining: errorData.remaining,
            });
          }
        } catch {
          // Fallback error message
          setRateLimitError({
            message: "You've reached your prompt limit.",
            limit: 0,
            remaining: 0,
          });
        }
      }
    },
  });

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        status,
        rateLimitError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}