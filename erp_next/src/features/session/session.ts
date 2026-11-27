import { MOCK_SESSION } from "@/common/const";
import type { Session } from "@/common/type";

/**
 * Returns the signed-in user. Mock until real authentication exists.
 * TODO: replace with the logged-in user (cookie / token) once the backend is added.
 */
export function getSession(): Session {
  return MOCK_SESSION;
}
