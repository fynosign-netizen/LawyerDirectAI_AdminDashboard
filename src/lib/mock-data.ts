export interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "lawyer";
  status: "active" | "inactive" | "pending";
  joinedDate: string;
  consultations: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalLawyers: number;
  totalClients: number;
  activeConsultations: number;
  totalRevenue: number;
  pendingApprovals: number;
  consultationsToday: number;
  avgRating: number;
}

export const dashboardStats: DashboardStats = {
  totalUsers: 2847,
  totalLawyers: 342,
  totalClients: 2505,
  activeConsultations: 18,
  totalRevenue: 128450,
  pendingApprovals: 12,
  consultationsToday: 47,
  avgRating: 4.8,
};

export const recentActivity = [
  { id: "1", action: "New lawyer registered", name: "Sarah Mitchell", time: "2 min ago" },
  { id: "2", action: "Consultation completed", name: "John Davis", time: "15 min ago" },
  { id: "3", action: "Payment received", name: "Maria Garcia", time: "32 min ago" },
  { id: "4", action: "New client signup", name: "Alex Thompson", time: "1 hr ago" },
  { id: "5", action: "Lawyer verified", name: "Robert Chen", time: "2 hr ago" },
  { id: "6", action: "Consultation started", name: "Emily Watson", time: "3 hr ago" },
];

export const users: User[] = [
  { id: "1", name: "Sarah Mitchell", email: "sarah.mitchell@email.com", role: "lawyer", status: "active", joinedDate: "2025-11-15", consultations: 87 },
  { id: "2", name: "John Davis", email: "john.davis@email.com", role: "client", status: "active", joinedDate: "2025-12-03", consultations: 5 },
  { id: "3", name: "Maria Garcia", email: "maria.garcia@email.com", role: "client", status: "active", joinedDate: "2026-01-08", consultations: 12 },
  { id: "4", name: "Robert Chen", email: "robert.chen@email.com", role: "lawyer", status: "pending", joinedDate: "2026-01-22", consultations: 0 },
  { id: "5", name: "Emily Watson", email: "emily.watson@email.com", role: "client", status: "active", joinedDate: "2025-10-19", consultations: 23 },
  { id: "6", name: "Alex Thompson", email: "alex.thompson@email.com", role: "lawyer", status: "active", joinedDate: "2025-09-05", consultations: 145 },
  { id: "7", name: "Lisa Park", email: "lisa.park@email.com", role: "client", status: "inactive", joinedDate: "2025-08-12", consultations: 3 },
  { id: "8", name: "James Wilson", email: "james.wilson@email.com", role: "lawyer", status: "active", joinedDate: "2025-07-28", consultations: 201 },
  { id: "9", name: "Priya Patel", email: "priya.patel@email.com", role: "client", status: "active", joinedDate: "2026-01-30", consultations: 1 },
  { id: "10", name: "David Kim", email: "david.kim@email.com", role: "lawyer", status: "pending", joinedDate: "2026-02-01", consultations: 0 },
  { id: "11", name: "Rachel Adams", email: "rachel.adams@email.com", role: "client", status: "active", joinedDate: "2025-12-20", consultations: 8 },
  { id: "12", name: "Michael Brown", email: "michael.brown@email.com", role: "lawyer", status: "active", joinedDate: "2025-06-14", consultations: 312 },
];
