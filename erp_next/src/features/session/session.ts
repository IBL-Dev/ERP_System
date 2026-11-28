import { MOCK_ADMIN, MOCK_USERS } from "@/common/const";
import type { Session } from "@/common/type";

export function findMockUserById(userId: string): Session | undefined {
  return MOCK_USERS.find((user) => user.userId === userId);
}

/**
 * Picks the mock user for a login. Until the backend exists any non-empty password works,
 * and an unknown user name signs in as the Admin user (the lower-privilege role).
 * TODO: replace with the authenticated user returned by the backend.
 */
export function resolveLoginUser(username: string): Session {
  return findMockUserById(username.trim().toUpperCase()) ?? MOCK_ADMIN;
}
