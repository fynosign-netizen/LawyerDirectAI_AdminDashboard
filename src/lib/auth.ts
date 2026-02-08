const ADMIN_EMAIL = "admin@lawyerdirect.com";
const ADMIN_PASSWORD = "admin123";

export function authenticate(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

const AUTH_KEY = "lawyer_direct_admin_auth";

export function setAuth(): void {
  sessionStorage.setItem(AUTH_KEY, "true");
}

export function clearAuth(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}
