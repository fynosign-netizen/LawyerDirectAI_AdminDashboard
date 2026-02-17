import { useEffect, useState, useMemo } from "react";
import {
  Send,
  Loader2,
  Bell,
  Users,
  Scale,
  UserCheck,
  BarChart3,
  Megaphone,
  Inbox,
  Search,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Smartphone,
  TrendingUp,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  api,
  type AdminBroadcast,
  type AdminNotification,
  type NotificationStats,
  type Pagination,
} from "@/lib/api";

const TARGET_OPTIONS = [
  { value: "ALL", label: "All Users", icon: Users },
  { value: "CLIENTS", label: "Clients Only", icon: UserCheck },
  { value: "LAWYERS", label: "Lawyers Only", icon: Scale },
] as const;

const TABS = [
  { id: "compose", label: "Compose", icon: Send },
  { id: "broadcasts", label: "Broadcast History", icon: Megaphone },
  { id: "notifications", label: "User Notifications", icon: Inbox },
] as const;

type TabId = (typeof TABS)[number]["id"];

const NOTIFICATION_TEMPLATES = [
  {
    name: "App Update",
    title: "New App Update Available",
    body: "We've released a new version with exciting features and improvements. Update now for the best experience!",
  },
  {
    name: "Maintenance",
    title: "Scheduled Maintenance",
    body: "We'll be performing scheduled maintenance on [DATE] from [TIME] to [TIME]. The app may be temporarily unavailable during this period.",
  },
  {
    name: "Welcome",
    title: "Welcome to Lawyer Direct!",
    body: "Thank you for joining Lawyer Direct. We're here to connect you with qualified legal professionals. Explore the app to get started!",
  },
  {
    name: "Holiday",
    title: "Holiday Notice",
    body: "Happy holidays from the Lawyer Direct team! Please note that response times may be longer during the holiday period.",
  },
  {
    name: "Feature Launch",
    title: "New Feature: [Feature Name]",
    body: "We're excited to announce [Feature Name]! This new feature allows you to [brief description]. Try it out today!",
  },
  {
    name: "Policy Update",
    title: "Important Policy Update",
    body: "We've updated our terms of service and privacy policy. Please review the changes in the app settings. These changes take effect on [DATE].",
  },
];

const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  admin_broadcast: { label: "Broadcast", color: "bg-purple-50 text-purple-700" },
  consultation_accepted: { label: "Consultation", color: "bg-green-50 text-green-700" },
  consultation_declined: { label: "Consultation", color: "bg-red-50 text-red-700" },
  consultation_completed: { label: "Consultation", color: "bg-emerald-50 text-emerald-700" },
  consultation_cancelled: { label: "Consultation", color: "bg-orange-50 text-orange-700" },
  consultation_reminder: { label: "Reminder", color: "bg-yellow-50 text-yellow-700" },
  trial_expiring: { label: "Trial", color: "bg-amber-50 text-amber-700" },
  trial_expired: { label: "Trial", color: "bg-red-50 text-red-700" },
  new_message: { label: "Message", color: "bg-blue-50 text-blue-700" },
  incoming_call: { label: "Call", color: "bg-sky-50 text-sky-700" },
  incoming_video_call: { label: "Video Call", color: "bg-sky-50 text-sky-700" },
  missed_call: { label: "Missed Call", color: "bg-orange-50 text-orange-700" },
  payment_received: { label: "Payment", color: "bg-green-50 text-green-700" },
  payment_succeeded: { label: "Payment", color: "bg-green-50 text-green-700" },
  payment_failed: { label: "Payment", color: "bg-red-50 text-red-700" },
  payout_sent: { label: "Payout", color: "bg-emerald-50 text-emerald-700" },
  payout_failed: { label: "Payout", color: "bg-red-50 text-red-700" },
  new_review: { label: "Review", color: "bg-indigo-50 text-indigo-700" },
  verification_approved: { label: "Verification", color: "bg-green-50 text-green-700" },
  verification_rejected: { label: "Verification", color: "bg-red-50 text-red-700" },
  new_sign_in: { label: "Security", color: "bg-slate-50 text-slate-700" },
  new_job_post: { label: "Job Post", color: "bg-violet-50 text-violet-700" },
  job_post_accepted: { label: "Job Post", color: "bg-green-50 text-green-700" },
  new_consultation: { label: "Consultation", color: "bg-blue-50 text-blue-700" },
  dispute_opened: { label: "Dispute", color: "bg-red-50 text-red-700" },
  dispute_resolved: { label: "Dispute", color: "bg-green-50 text-green-700" },
  ticket_reply: { label: "Ticket", color: "bg-blue-50 text-blue-700" },
  inactivity_reminder: { label: "Reminder", color: "bg-yellow-50 text-yellow-700" },
};

function getTypeDisplay(type: string) {
  return NOTIFICATION_TYPE_LABELS[type] || { label: type.replace(/_/g, " "), color: "bg-gray-50 text-gray-600" };
}

function targetBadge(t: string) {
  switch (t) {
    case "CLIENTS":
      return <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">Clients</Badge>;
    case "LAWYERS":
      return <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-xs">Lawyers</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">All Users</Badge>;
  }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ─── Stats Cards ───────────────────────────────────────────────

function StatsSection({ stats, loading }: { stats: NotificationStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Broadcasts",
      value: stats.totalBroadcasts,
      subtitle: `${stats.broadcastsThisMonth} this month`,
      icon: Megaphone,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
    {
      title: "Notifications Sent",
      value: stats.totalNotifications.toLocaleString(),
      subtitle: `${stats.notificationsToday} today · ${stats.notificationsThisWeek} this week`,
      icon: Bell,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "Push Token Rate",
      value: `${stats.pushTokenRate}%`,
      subtitle: `${stats.activePushTokens} of ${stats.totalUsers} users`,
      icon: Smartphone,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      title: "Users Reached",
      value: stats.totalUsersReached.toLocaleString(),
      subtitle: `${stats.unreadNotifications.toLocaleString()} unread`,
      icon: TrendingUp,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={`rounded-lg p-2 ${card.iconBg}`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Notification Type Breakdown ───────────────────────────────

function TypeBreakdown({ stats }: { stats: NotificationStats | null }) {
  if (!stats || stats.notificationsByType.length === 0) return null;

  const maxCount = Math.max(...stats.notificationsByType.map((n) => n.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Notifications by Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stats.notificationsByType.map((item) => {
            const display = getTypeDisplay(item.type);
            const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={item.type} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${display.color}`}>
                    {display.label}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-5 w-full rounded-full bg-muted">
                    <div
                      className="flex h-5 items-center rounded-full bg-primary/15 pl-2 text-xs font-medium text-primary transition-all"
                      style={{ width: `${Math.max(widthPercent, 8)}%` }}
                    >
                      {item.count}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Compose Tab ───────────────────────────────────────────────

function ComposeTab({ onSent }: { onSent: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<string>("ALL");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const charCount = body.length;
  const maxChars = 500;

  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.post<{ data: AdminBroadcast }>("/admin/notifications/broadcast", {
        title: title.trim(),
        body: body.trim(),
        target,
      });
      setSendResult({
        success: true,
        message: `Notification sent to ${res.data.sentCount} user${res.data.sentCount !== 1 ? "s" : ""}!`,
      });
      setTitle("");
      setBody("");
      setTarget("ALL");
      onSent();
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || "Failed to send notification" });
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template: (typeof NOTIFICATION_TEMPLATES)[number]) => {
    setTitle(template.title);
    setBody(template.body);
    setShowTemplates(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Compose Broadcast
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Templates
              {showTemplates ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Templates dropdown */}
          {showTemplates && (
            <div className="mb-4 grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {NOTIFICATION_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t)}
                  className="rounded-lg border bg-background p-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.title}</p>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {/* Target selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Target Audience</label>
              <div className="flex gap-2">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTarget(opt.value)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      target === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                maxLength={100}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">{title.length}/100 characters</p>
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, maxChars))}
                placeholder="Write your notification message..."
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className={`mt-1 text-xs ${charCount > maxChars * 0.9 ? "text-orange-600" : "text-muted-foreground"}`}>
                {charCount}/{maxChars} characters
              </p>
            </div>

            {/* Result message */}
            {sendResult && (
              <div
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  sendResult.success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {sendResult.success ? (
                  <Bell className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {sendResult.message}
              </div>
            )}

            {/* Send button */}
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={sending || !title.trim() || !body.trim()}
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sending ? "Sending..." : "Preview & Send"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Broadcast</DialogTitle>
            <DialogDescription>
              Review your notification before sending. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">TO:</span>
              {targetBadge(target)}
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{body}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Broadcast History Tab ─────────────────────────────────────

function BroadcastHistoryTab({ refreshKey }: { refreshKey: number }) {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AdminBroadcast[]; pagination: Pagination }>(
        `/admin/notifications/broadcast?page=${p}&limit=15`
      );
      setBroadcasts(res.data);
      setPagination(res.pagination);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await api.delete(`/admin/notifications/broadcast/${id}`);
      fetchHistory(page);
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/notifications/broadcast/${id}/resend`, {});
      fetchHistory(1);
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBroadcasts = useMemo(() => {
    let filtered = broadcasts;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) => b.title.toLowerCase().includes(q) || b.body.toLowerCase().includes(q)
      );
    }
    if (targetFilter) {
      filtered = filtered.filter((b) => b.target === targetFilter);
    }
    return filtered;
  }, [broadcasts, search, targetFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" />
            Broadcast History
            {pagination && (
              <Badge variant="secondary" className="ml-1 text-xs">{pagination.total}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search broadcasts..."
                className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Targets</option>
              <option value="ALL">All Users</option>
              <option value="CLIENTS">Clients</option>
              <option value="LAWYERS">Lawyers</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBroadcasts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {search || targetFilter ? "No broadcasts match your filters" : "No broadcasts sent yet"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Sent To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBroadcasts.map((b) => (
                  <>
                    <TableRow
                      key={b.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    >
                      <TableCell className="font-medium">{b.title}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-1 text-muted-foreground">{b.body}</span>
                      </TableCell>
                      <TableCell>{targetBadge(b.target)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {b.sentCount} user{b.sentCount !== 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(b.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Resend"
                            disabled={actionLoading === b.id}
                            onClick={(e) => { e.stopPropagation(); handleResend(b.id); }}
                          >
                            {actionLoading === b.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            title="Delete"
                            disabled={actionLoading === b.id}
                            onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            {expandedId === b.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === b.id && (
                      <TableRow key={`${b.id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Full Message</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm">{b.body}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>Sent by: <strong className="text-foreground">{b.sentBy}</strong></span>
                              <span>Target: <strong className="text-foreground">{b.target}</strong></span>
                              <span>Push delivered: <strong className="text-foreground">{b.sentCount}</strong></span>
                              <span>
                                Sent: <strong className="text-foreground">
                                  {new Date(b.createdAt).toLocaleString()}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={page <= 1}
                onClick={() => fetchHistory(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                let pageNum: number;
                if (pagination.pages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= pagination.pages - 3) {
                  pageNum = pagination.pages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === page ? "default" : "outline"}
                    className="h-7 w-7 p-0"
                    onClick={() => fetchHistory(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={page >= (pagination?.pages ?? 1)}
                onClick={() => fetchHistory(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── User Notifications Tab ────────────────────────────────────

function UserNotificationsTab() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchNotifications = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (typeFilter) params.set("type", typeFilter);
      if (readFilter) params.set("unread", readFilter);
      if (search) params.set("search", search);

      const res = await api.get<{ data: AdminNotification[]; pagination: Pagination }>(
        `/admin/notifications/all?${params}`
      );
      setNotifications(res.data);
      setPagination(res.pagination);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, readFilter, search]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/admin/notifications/${id}`);
      fetchNotifications(page);
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "admin_broadcast", label: "Broadcast" },
    { value: "consultation", label: "Consultation" },
    { value: "payment", label: "Payment" },
    { value: "payout", label: "Payout" },
    { value: "new_message", label: "Message" },
    { value: "incoming_call", label: "Call" },
    { value: "new_review", label: "Review" },
    { value: "verification", label: "Verification" },
    { value: "new_sign_in", label: "Security" },
    { value: "new_job_post", label: "Job Post" },
    { value: "dispute", label: "Dispute" },
    { value: "ticket", label: "Ticket" },
    { value: "trial", label: "Trial" },
    { value: "inactivity", label: "Inactivity" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4" />
            All User Notifications
            {pagination && (
              <Badge variant="secondary" className="ml-1 text-xs">{pagination.total.toLocaleString()}</Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search notifications..."
                className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Status</option>
              <option value="true">Unread</option>
              <option value="false">Read</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No notifications found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((n) => {
                  const display = getTypeDisplay(n.type);
                  return (
                    <TableRow key={n.id} className={!n.read ? "bg-primary/[0.02]" : undefined}>
                      <TableCell className="w-8 pr-0">
                        {n.read ? (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground/40" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-blue-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm font-medium">
                            {n.user.firstName} {n.user.lastName}
                          </span>
                          <p className="text-xs text-muted-foreground">{n.user.email}</p>
                          <Badge variant="secondary" className="mt-0.5 text-[10px]">{n.user.role}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${display.color}`}>
                          {display.label}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="line-clamp-1 text-sm font-medium">{n.title}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-1 text-sm text-muted-foreground">{n.body}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground" title={new Date(n.createdAt).toLocaleString()}>
                          {timeAgo(n.createdAt)}
                        </div>
                        {n.readAt && (
                          <div className="text-[10px] text-muted-foreground/60">
                            Read {timeAgo(n.readAt)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          title="Delete notification"
                          disabled={deleting === n.id}
                          onClick={() => handleDelete(n.id)}
                        >
                          {deleting === n.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {pagination.pages} · {pagination.total.toLocaleString()} total
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={page <= 1}
                onClick={() => fetchNotifications(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                let pageNum: number;
                if (pagination.pages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= pagination.pages - 3) {
                  pageNum = pagination.pages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === page ? "default" : "outline"}
                    className="h-7 w-7 p-0"
                    onClick={() => fetchNotifications(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={page >= (pagination?.pages ?? 1)}
                onClick={() => fetchNotifications(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("compose");
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [broadcastRefreshKey, setBroadcastRefreshKey] = useState(0);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get<{ data: NotificationStats }>("/admin/notifications/stats");
      setStats(res.data);
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBroadcastSent = () => {
    setBroadcastRefreshKey((k) => k + 1);
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Send broadcasts, view notification history, and monitor delivery
        </p>
      </div>

      {/* Stats */}
      <StatsSection stats={stats} loading={statsLoading} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "compose" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ComposeTab onSent={handleBroadcastSent} />
          </div>
          <div>
            <TypeBreakdown stats={stats} />
          </div>
        </div>
      )}

      {activeTab === "broadcasts" && (
        <BroadcastHistoryTab refreshKey={broadcastRefreshKey} />
      )}

      {activeTab === "notifications" && (
        <UserNotificationsTab />
      )}
    </div>
  );
}
