import { apiRequest, clearStoredToken, setStoredToken } from "./client";
import type { AuthLogin, AuthRegister, AuthToken, MeProfile } from "./types";

export async function register(data: AuthRegister): Promise<AuthToken> {
  const result = await apiRequest<AuthToken>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setStoredToken(result.token);
  return result;
}

export async function login(data: AuthLogin): Promise<AuthToken> {
  const result = await apiRequest<AuthToken>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setStoredToken(result.token);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {}
  clearStoredToken();
}

export async function logoutAll(): Promise<void> {
  try {
    await apiRequest("/auth/logout-all", { method: "POST" });
  } catch {}
  clearStoredToken();
}

export async function verifyToken(): Promise<MeProfile> {
  return apiRequest("/auth/verify");
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<MeProfile> {
  return apiRequest("/auth/password-change", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}
