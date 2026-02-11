import { useEffect, useState, useCallback } from "react";
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
  FileText,
  IdCard,
  Phone,
  Mail,
  Search,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  X,
  Monitor,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  api,
  type DashboardStats,
  type AnalyticsData,
  type TopLawyer,
  type VisitorStats,
  type CalendarData,
  type AdminTodo,
} from "@/lib/api";
import { RegistrationChart } from "@/components/charts/RegistrationChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { DistributionPieChart } from "@/components/charts/DistributionPieChart";
import { USAMapChart } from "@/components/charts/USAMapChart";
import { useNavigate } from "react-router-dom";

// ── Helpers ──

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonth(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Handle +1XXXXXXXXXX or 1XXXXXXXXXX or XXXXXXXXXX
  const local = digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  if (local.length === 10) {
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return phone; // Return as-is if not a standard US number
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400",
};

// ── Component ──

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Chart date filter
  const [chartFrom, setChartFrom] = useState("");
  const [chartTo, setChartTo] = useState("");
  const [chartDateApplied, setChartDateApplied] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // (signups: no filter state — always show last 24h)

  // Top lawyers
  const [topLawyers, setTopLawyers] = useState<TopLawyer[]>([]);
  const [lawyerSearch, setLawyerSearch] = useState("");
  const [lawyerSort, setLawyerSort] = useState<{ key: keyof TopLawyer; dir: "asc" | "desc" }>({ key: "consultations", dir: "desc" });

  // Visitor stats
  const [visitors, setVisitors] = useState<VisitorStats | null>(null);
  const [visitorPeriod] = useState(90);

  // Calendar
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatDate(today.getFullYear(), today.getMonth(), today.getDate()));
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [dayTodos, setDayTodos] = useState<AdminTodo[]>([]);

  // ── Initial load ──
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ data: DashboardStats }>("/admin/stats"),
      api.get<{ data: AnalyticsData }>("/admin/analytics?period=30"),
    ])
      .then(([statsRes, analyticsRes]) => {
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch top lawyers
  useEffect(() => {
    const params = new URLSearchParams({ limit: "5" });
    if (lawyerSearch) params.set("search", lawyerSearch);
    api.get<{ data: TopLawyer[] }>(`/admin/top-lawyers?${params}`)
      .then((res) => setTopLawyers(res.data))
      .catch(() => {});
  }, [lawyerSearch]);

  // Fetch visitor stats
  useEffect(() => {
    api.get<{ data: VisitorStats }>(`/admin/visitors?period=${visitorPeriod}`)
      .then((res) => setVisitors(res.data))
      .catch(() => {});
  }, [visitorPeriod]);

  // Fetch calendar data
  useEffect(() => {
    api.get<{ data: CalendarData }>(`/admin/calendar?month=${formatMonth(calYear, calMonth)}`)
      .then((res) => setCalendarData(res.data))
      .catch(() => {});
  }, [calYear, calMonth]);

  // Fetch todos for selected date
  useEffect(() => {
    if (!selectedDate) return;
    const dayData = calendarData[selectedDate];
    if (dayData?.todos) {
      // Calendar endpoint returns basic todo info; use it directly
      setDayTodos(dayData.todos as unknown as AdminTodo[]);
    } else {
      setDayTodos([]);
    }
  }, [selectedDate, calendarData]);

  // ── Chart filter ──
  const fetchChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams();
      if (chartFrom) params.set("from", chartFrom);
      if (chartTo) params.set("to", chartTo);
      if (!chartFrom && !chartTo) params.set("period", "30");
      const res = await api.get<{ data: AnalyticsData }>(`/admin/analytics?${params}`);
      setAnalytics(res.data);
      setChartDateApplied(!!(chartFrom || chartTo));
    } catch {}
    finally { setChartLoading(false); }
  }, [chartFrom, chartTo]);

  const clearChartFilter = () => {
    setChartFrom("");
    setChartTo("");
    setChartDateApplied(false);
    api.get<{ data: AnalyticsData }>("/admin/analytics?period=30")
      .then((res) => setAnalytics(res.data))
      .catch(() => {});
  };

  // (signups filter removed — last 24h only)

  // ── Top lawyers sort ──
  const sortedLawyers = [...topLawyers].sort((a, b) => {
    const aVal = a[lawyerSort.key] as number;
    const bVal = b[lawyerSort.key] as number;
    return lawyerSort.dir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (key: "consultations" | "revenue" | "rating") => {
    setLawyerSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );
  };

  const sortIcon = (key: string) =>
    lawyerSort.key === key ? (lawyerSort.dir === "desc" ? " \u2193" : " \u2191") : " \u2195";

  // ── Calendar navigation ──
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  // Mark todo complete
  const completeTodo = async (id: string) => {
    try {
      await api.put(`/admin/todos/${id}`, { completed: true });
      setDayTodos((prev) => prev.filter((t) => t.id !== id));
      // Refresh calendar data
      const res = await api.get<{ data: CalendarData }>(`/admin/calendar?month=${formatMonth(calYear, calMonth)}`);
      setCalendarData(res.data);
    } catch {}
  };

  // ── Calendar grid ──
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const signupUsers = (stats?.recentUsers ?? []).filter((u) => new Date(u.createdAt) >= last24h);

  // ── Loading / Error ──
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your platform metrics</p>
      </div>

      {/* ── Stat Cards (compact) ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-1 text-xl font-bold tracking-tight">{card.value}</p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts + Visitors ── */}
      {analytics && (
        <>
          {/* Chart Date Filter */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <input type="date" value={chartFrom} onChange={(e) => setChartFrom(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={chartTo} onChange={(e) => setChartTo(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs" />
            <button onClick={fetchChartData} disabled={chartLoading || (!chartFrom && !chartTo)} className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {chartLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              Filter
            </button>
            {chartDateApplied && (
              <button onClick={clearChartFilter} className="h-8 rounded-md border px-2 text-xs text-muted-foreground hover:bg-muted">Clear</button>
            )}
          </div>

          {/* Row: Registration Chart (2/3) + Total Visitors (1/3) */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RegistrationChart data={analytics.registrationsByDay} />
            </div>

            {/* Total Visitors */}

            <Card>
              <CardHeader className="">
                <div className="flex items-center justify-between">
                  <CardTitle  className="text-base">Total Visitors</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {visitors ? (
                  <>
                    {/* Big number */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Eye className="h-4 w-4" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">
                          {visitors.totalVisitors >= 1000000
                            ? `${(visitors.totalVisitors / 1000000).toFixed(2)}M`
                            : visitors.totalVisitors >= 1000
                              ? `${(visitors.totalVisitors / 1000).toFixed(1)}K`
                              : visitors.totalVisitors}
                        </span>
                        {visitors.changePercent !== 0 && (
                          <Badge variant="secondary" className={`text-xs ${visitors.changePercent > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {visitors.changePercent > 0 ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                            {Math.abs(visitors.changePercent).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Mobile + Desktop bars */}
                    <div className="space-y-2.5">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-medium text-muted-foreground"><Smartphone className="h-3 w-3" /> Mobile</span>
                          <span className="font-semibold">{visitors.mobile.percent.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${visitors.mobile.percent}%` }} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{visitors.mobile.sessions.toLocaleString()} sessions</p>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-medium text-muted-foreground"><Monitor className="h-3 w-3" /> Desktop</span>
                          <span className="font-semibold">{visitors.desktop.percent.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-cyan-500 transition-all" style={{ width: `${visitors.desktop.percent}%` }} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{visitors.desktop.sessions.toLocaleString()} sessions</p>
                      </div>
                    </div>

                    {/* Goals mini table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-1 font-medium">Goal</th>
                            <th className="pb-1 font-medium">Done</th>
                            <th className="pb-1 font-medium">Target</th>
                            <th className="pb-1 font-medium text-right">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[
                            { goal: "Visitors", completed: visitors.totalVisitors, target: 1000 },
                            { goal: "Mobile", completed: visitors.mobile.visitors, target: 600 },
                            { goal: "Desktop", completed: visitors.desktop.visitors, target: 300 },
                          ].map((row) => (
                            <tr key={row.goal}>
                              <td className="py-1.5 font-medium">{row.goal}</td>
                              <td className="py-1.5">{row.completed.toLocaleString()}</td>
                              <td className="py-1.5">{row.target.toLocaleString()}</td>
                              <td className="py-1.5 text-right">{Math.min(Math.round((row.completed / row.target) * 100), 100)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row: 3 equal charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <DistributionPieChart data={analytics.usersByRole} title="Users by Role" />
            <DistributionPieChart data={analytics.consultationsByCategory} title="Consultations by Category" />
            <RevenueChart data={analytics.revenueByMonth} />
          </div>
        </>
      )}

      {/* ── Top Performing (2/3) + Calendar (1/3) ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Performing Lawyers */}
        <Card className="lg:col-span-2">
          <CardHeader className="">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-semibold">Top Performing</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={lawyerSearch}
                  onChange={(e) => setLawyerSearch(e.target.value)}
                  className="h-7 w-40 rounded-md border bg-background pl-7 pr-2 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">User</th>
                    <th className="cursor-pointer pb-2 font-medium select-none" onClick={() => toggleSort("consultations")}>
                      Consultations{sortIcon("consultations")}
                    </th>
                    <th className="cursor-pointer pb-2 font-medium select-none" onClick={() => toggleSort("revenue")}>
                      Revenue{sortIcon("revenue")}
                    </th>
                    <th className="cursor-pointer pb-2 font-medium select-none" onClick={() => toggleSort("rating")}>
                      Rating{sortIcon("rating")}
                    </th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedLawyers.map((lawyer) => (
                    <tr key={lawyer.id} className="group">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          {lawyer.avatar ? (
                            <img src={lawyer.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                              {lawyer.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium leading-tight">{lawyer.name}</p>
                            <p className="text-[11px] text-muted-foreground">{lawyer.specialization}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-sm">{lawyer.consultations}</td>
                      <td className="py-2.5 pr-3 text-sm">${lawyer.revenue.toLocaleString()}</td>
                      <td className="py-2.5 pr-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {lawyer.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => navigate("/dashboard/lawyers")}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedLawyers.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No lawyers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Widget */}
        <Card>
          <CardContent>
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button onClick={prevMonth} className="rounded p-1 hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">{MONTH_NAMES[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="rounded p-1 hover:bg-muted">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px text-center text-[11px] font-medium text-muted-foreground mb-1">
              {DAY_NAMES.map((d) => <div key={d} className="py-0.5">{d}</div>)}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px">
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} className="py-1.5" />;
                const dateStr = formatDate(calYear, calMonth, day);
                const dayData = calendarData[dateStr];
                const hasRegs = dayData && dayData.registrations > 0;
                const hasConsults = dayData && dayData.consultations > 0;
                const hasTodos = dayData?.todos && dayData.todos.length > 0;
                const hasDots = hasRegs || hasConsults || hasTodos;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex flex-col items-center rounded py-1.5 text-xs transition-colors hover:bg-muted ${
                      isToday(day) ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                    } ${isSelected && !isToday(day) ? "bg-muted font-semibold" : ""}`}
                  >
                    {day}
                    {hasDots && (
                      <span className="absolute bottom-0 flex gap-px justify-center">
                        {hasRegs && <span className="inline-block h-1 w-1 rounded-full bg-blue-500" />}
                        {hasConsults && <span className="inline-block h-1 w-1 rounded-full bg-green-500" />}
                        {hasTodos && <span className="inline-block h-1 w-1 rounded-full bg-orange-500" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" /> Registrations</span>
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Consultations</span>
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" /> Todos</span>
            </div>

            {/* Schedule */}
            <div className="mt-3 border-t pt-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium">
                  {selectedDate === formatDate(today.getFullYear(), today.getMonth(), today.getDate())
                    ? "Today's Schedule"
                    : `Schedule: ${selectedDate}`}
                </h4>
                <button
                  onClick={() => navigate("/dashboard/calendar")}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {dayTodos.length > 0 ? (
                  dayTodos.filter((t) => !t.completed).map((todo) => (
                    <div key={todo.id} className="flex items-start gap-2 rounded-md border p-2">
                      <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.medium}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight">{todo.title}</p>
                        {todo.description && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{todo.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => completeTodo(todo.id)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Mark complete"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-[11px] text-muted-foreground">
                    No tasks for this date
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── USA Map ── */}
      <USAMapChart />

      {/* ── Recent Signups (last 24 h) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Signups</CardTitle>
            <span className="text-xs text-muted-foreground">Last 24 hours</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Contact</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Documents</th>
                  <th className="pb-2 text-right font-medium">Signed Up</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {signupUsers.map((user) => (
                  <tr key={user.id} className="group">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        )}
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {user.phone ? (
                            <span className="text-xs">{formatPhone(user.phone)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No phone</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="secondary"
                          className={`w-fit text-xs ${user.role === "LAWYER" ? "bg-indigo-50 text-indigo-700" : "bg-blue-50 text-blue-700"}`}
                        >
                          {user.role}
                        </Badge>
                        {user.lawyerProfile && (
                          <Badge
                            variant="outline"
                            className={`w-fit text-xs ${
                              user.lawyerProfile.verificationStatus === "VERIFIED"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : user.lawyerProfile.verificationStatus === "REJECTED"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-yellow-200 bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {user.lawyerProfile.verificationStatus}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      {user.lawyerProfile ? (
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            {user.lawyerProfile.licenseImage ? (
                              <button
                                onClick={() => window.open(user.lawyerProfile!.licenseImage!, "_blank")}
                                className="group/thumb block overflow-hidden rounded border transition hover:border-indigo-400"
                                title="View Bar License"
                              >
                                <img src={user.lawyerProfile.licenseImage} alt="Bar License" className="h-8 w-12 object-cover transition group-hover/thumb:scale-105" />
                              </button>
                            ) : (
                              <div className="flex h-8 w-12 items-center justify-center rounded border border-dashed text-muted-foreground">
                                <FileText className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="mt-0.5 block text-[9px] text-muted-foreground">
                              {user.lawyerProfile.licenseImage ? "License" : "No License"}
                            </span>
                          </div>
                          <div className="text-center">
                            {user.lawyerProfile.idImage ? (
                              <button
                                onClick={() => window.open(user.lawyerProfile!.idImage!, "_blank")}
                                className="group/thumb block overflow-hidden rounded border transition hover:border-indigo-400"
                                title="View ID"
                              >
                                <img src={user.lawyerProfile.idImage} alt="Government ID" className="h-8 w-12 object-cover transition group-hover/thumb:scale-105" />
                              </button>
                            ) : (
                              <div className="flex h-8 w-12 items-center justify-center rounded border border-dashed text-muted-foreground">
                                <IdCard className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="mt-0.5 block text-[9px] text-muted-foreground">
                              {user.lawyerProfile.idImage ? "ID" : "No ID"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
