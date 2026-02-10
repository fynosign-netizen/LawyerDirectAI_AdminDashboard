import { api, setAdminToken, clearAdminToken } from "./api";

const AUTH_KEY = "lawyer_direct_admin_auth";

export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await api.post<{
      success: boolean;
      token: string;
      user: { id: string; email: string; firstName: string; lastName: string };
    }>("/admin/login", { email, password });

    setAdminToken(data.token);
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export function clearAuth(): void {
  clearAdminToken();
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}
