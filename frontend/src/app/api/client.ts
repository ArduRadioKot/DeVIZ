const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TOKEN_KEY = "authToken";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = res.statusText;
    let code = "unknown";
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
      code = body.code ?? code;
    } catch {}

    if (res.status === 401) {
      clearStoredToken();
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    throw new ApiError(
      res.status,
      code,
      typeof detail === "string" ? detail : "API Error",
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
