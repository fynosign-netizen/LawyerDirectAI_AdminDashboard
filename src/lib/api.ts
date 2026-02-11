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
  recentUsers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    isVerified: boolean;
    avatar: string | null;
    createdAt: string;
    _count?: { consultationsAsClient: number };
    lawyerProfile: {
      verificationStatus: string;
      licenseImage: string | null;
      idImage: string | null;
      barNumber: string;
      licenseState: string;
      specializations?: string[];
      _count?: { consultations: number };
    } | null;
  }[];
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
    licenseImage: string | null;
    idImage: string | null;
    barNumber: string;
    licenseState: string;
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
  licenseImage: string | null;
  idImage: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; phone: string | null; avatar: string | null; createdAt: string };
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

export type RecentUser = DashboardStats["recentUsers"][number];

export interface AdminBroadcast {
  id: string;
  title: string;
  body: string;
  target: string;
  sentBy: string;
  sentCount: number;
  createdAt: string;
}

// Analytics types
export interface AnalyticsData {
  registrationsByDay: { date: string; clients: number; lawyers: number; total: number }[];
  revenueByDay: { date: string; amount: number }[];
  consultationsByCategory: { name: string; value: number }[];
  consultationsByStatus: { name: string; value: number }[];
  usersByRole: { name: string; value: number }[];
  revenueByMonth: { month: string; amount: number }[];
}

// Calendar types
export interface CalendarDayData {
  registrations: number;
  consultations: number;
  todos: { id: string; title: string; completed: boolean; priority: string }[];
}
export type CalendarData = Record<string, CalendarDayData>;

// Todo types
export interface AdminTodo {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

// Geography types
export type GeographyData = Record<string, { clients: number; lawyers: number }>;

// Top Performing Lawyers
export interface TopLawyer {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  consultations: number;
  revenue: number;
  rating: number;
}

// Visitor Stats
export interface VisitorStats {
  totalVisitors: number;
  totalSessions: number;
  changePercent: number;
  mobile: { visitors: number; sessions: number; percent: number };
  desktop: { visitors: number; sessions: number; percent: number };
  tablet: { visitors: number; sessions: number };
}
