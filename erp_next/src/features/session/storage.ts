const KEY = "lms-erp.session-user";
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/** The signed-in user id lives in sessionStorage (demo only): it survives a refresh, not a closed tab. */
export function readSessionUserId(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function signInAs(userId: string): void {
  try {
    window.sessionStorage.setItem(KEY, userId);
  } catch {
    // storage blocked: the app falls back to the login page
  }
  notify();
}

export function signOutSession(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
  notify();
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
