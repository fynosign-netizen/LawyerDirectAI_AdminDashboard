import { useEffect, useState } from "react";
import {
  Users,
  Scale,
  DollarSign,
  MessageSquare,
  Clock,
  Star,
  UserCheck,
  Activity,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type DashboardStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: DashboardStats }>("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Failed to load dashboard data
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, description: "All registered users", color: "text-blue-600 bg-blue-50" },
    { title: "Active Lawyers", value: stats.totalLawyers.toLocaleString(), icon: Scale, description: "Verified attorneys", color: "text-indigo-600 bg-indigo-50" },
    { title: "Total Clients", value: stats.totalClients.toLocaleString(), icon: UserCheck, description: "Registered clients", color: "text-violet-600 bg-violet-50" },
    { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, description: "Lifetime earnings", color: "text-emerald-600 bg-emerald-50" },
    { title: "Active Consultations", value: stats.activeConsultations.toString(), icon: MessageSquare, description: "Currently in progress", color: "text-amber-600 bg-amber-50" },
    { title: "Today's Sessions", value: stats.consultationsToday.toString(), icon: Clock, description: "Consultations today", color: "text-cyan-600 bg-cyan-50" },
    { title: "Pending Approvals", value: stats.pendingApprovals.toString(), icon: Activity, description: "Lawyers awaiting review", color: "text-orange-600 bg-orange-50" },
    { title: "Average Rating", value: stats.avgRating.toString(), icon: Star, description: "Platform-wide rating", color: "text-yellow-600 bg-yellow-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your platform metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-normal">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
