import {
  Users,
  Scale,
  DollarSign,
  MessageSquare,
  Clock,
  Star,
  UserCheck,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardStats, recentActivity } from "@/lib/mock-data";

const statCards = [
  {
    title: "Total Users",
    value: dashboardStats.totalUsers.toLocaleString(),
    icon: Users,
    description: "All registered users",
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Active Lawyers",
    value: dashboardStats.totalLawyers.toLocaleString(),
    icon: Scale,
    description: "Verified attorneys",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    title: "Total Clients",
    value: dashboardStats.totalClients.toLocaleString(),
    icon: UserCheck,
    description: "Registered clients",
    color: "text-violet-600 bg-violet-50",
  },
  {
    title: "Total Revenue",
    value: `$${dashboardStats.totalRevenue.toLocaleString()}`,
    icon: DollarSign,
    description: "Lifetime earnings",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Active Consultations",
    value: dashboardStats.activeConsultations.toString(),
    icon: MessageSquare,
    description: "Currently in progress",
    color: "text-amber-600 bg-amber-50",
  },
  {
    title: "Today's Sessions",
    value: dashboardStats.consultationsToday.toString(),
    icon: Clock,
    description: "Consultations today",
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    title: "Pending Approvals",
    value: dashboardStats.pendingApprovals.toString(),
    icon: Activity,
    description: "Lawyers awaiting review",
    color: "text-orange-600 bg-orange-50",
  },
  {
    title: "Average Rating",
    value: dashboardStats.avgRating.toString(),
    icon: Star,
    description: "Platform-wide rating",
    color: "text-yellow-600 bg-yellow-50",
  },
];

export default function DashboardPage() {
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
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {item.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.time}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
