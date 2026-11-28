"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/common/const";
import type { Session } from "@/common/type";
import { findMockUserById } from "./session";
import { readSessionUserId, signOutSession, subscribeSession } from "./storage";

const SessionContext = createContext<Session | null>(null);

// On the server and during hydration there is no storage yet, so nothing is rendered until it is read.
const serverSnapshot = (): string | null | undefined => undefined;

/**
 * Holds the signed-in mock user for every /(app) page. Children only render once a valid user exists,
 * so useSession() never returns null. A missing or unknown user goes back to the login page.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const userId = useSyncExternalStore<string | null | undefined>(subscribeSession, readSessionUserId, serverSnapshot);
  const session = userId ? findMockUserById(userId) : undefined;
  const mustLogIn = userId !== undefined && !session;

  useEffect(() => {
    if (!mustLogIn) return;
    if (userId) signOutSession(); // clear an unknown stored id
    router.replace(ROUTES.login);
  }, [mustLogIn, userId, router]);

  if (!session) return null;
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>.");
  return session;
}
