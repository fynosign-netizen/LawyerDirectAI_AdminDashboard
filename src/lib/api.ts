const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem("lawyer_direct_admin_token") || "";
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// Auth helpers
export function setAdminToken(token: string) {
  sessionStorage.setItem("lawyer_direct_admin_token", token);
  sessionStorage.setItem("lawyer_direct_admin_auth", "true");
}

export function clearAdminToken() {
  sessionStorage.removeItem("lawyer_direct_admin_token");
  sessionStorage.removeItem("lawyer_direct_admin_auth");
}

// Types for API responses
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalLawyers: number;
  totalClients: number;
  activeConsultations: number;
  consultationsToday: number;
  pendingApprovals: number;
  totalRevenue: number;
  avgRating: number;
  recentUsers: { id: string; firstName: string; lastName: string; role: string; createdAt: string }[];
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  lastActiveAt: string | null;
  suspended: boolean;
  lawyerProfile: {
    id: string;
    verificationStatus: string;
    specializations: string[];
    rating: number;
  } | null;
  _count: { consultationsAsClient: number };
}

export interface AdminLawyer {
  id: string;
  barNumber: string;
  licenseState: string;
  specializations: string[];
  rating: number;
  verificationStatus: string;
  isAvailable: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; createdAt: string };
  _count: { consultations: number; reviews: number };
}

export interface AdminConsultation {
  id: string;
  category: string;
  status: string;
  description: string;
  createdAt: string;
  client: { firstName: string; lastName: string };
  lawyer: { user: { firstName: string; lastName: string } } | null;
  payment: { amount: number; status: string } | null;
}

export interface AdminPayment {
  id: string;
  amount: number;
  status: string;
  stripePaymentId: string;
  createdAt: string;
  consultation: {
    category: string;
    client: { firstName: string; lastName: string };
    lawyer: { user: { firstName: string; lastName: string } } | null;
  };
}

export interface AdminReport {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  reporter: { firstName: string; lastName: string };
  reported: { firstName: string; lastName: string };
}

export interface AdminDispute {
  id: string;
  consultationId: string;
  category: string;
  description: string;
  status: string;
  resolutionType: string | null;
  resolutionNote: string | null;
  refundAmount: number | null;
  lawyerDeadline: string | null;
  mediationDeadline: string | null;
  resolvedAt: string | null;
  createdAt: string;
  filedBy: { firstName: string; lastName: string };
  filedAgainst: { firstName: string; lastName: string };
  consultation: {
    id: string;
    category: string;
    payment: { amount: number; status: string } | null;
  };
}
