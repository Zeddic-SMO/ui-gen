import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "anon-session";

export interface AnonSession {
  id: string;
  createdAt: number;
}

export async function getOrCreateAnonSession(): Promise<AnonSession> {
  const cookieStore = await cookies();
  const existingCookie = cookieStore.get(COOKIE_NAME)?.value;

  if (existingCookie) {
    try {
      const session = JSON.parse(existingCookie) as AnonSession;
      if (session.id && session.createdAt) {
        return session;
      }
    } catch {
      // Invalid cookie, create new session
    }
  }

  // Create new anonymous session
  const session: AnonSession = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Long expiry - 1 year
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  });

  return session;
}
