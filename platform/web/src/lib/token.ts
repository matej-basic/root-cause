// Bearer-token storage. The JWT lives in localStorage (different domains from
// the API, so cookies are not used). Every access is guarded: localStorage can
// throw or be empty in private windows, during SSR, or when site data is
// blocked, and nothing here may crash a render.

const TOKEN_KEY = "fl_token";
const RETURN_TO_KEY = "fl_return_to";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore: storage unavailable */
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function setReturnTo(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    /* ignore */
  }
}

export function takeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(RETURN_TO_KEY);
    window.localStorage.removeItem(RETURN_TO_KEY);
    return v;
  } catch {
    return null;
  }
}
