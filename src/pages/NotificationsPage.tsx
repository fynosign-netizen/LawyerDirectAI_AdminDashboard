import { useEffect, useState } from "react";
import { Send, Loader2, Bell, Users, Scale, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type AdminBroadcast, type Pagination } from "@/lib/api";

const TARGET_OPTIONS = [
  { value: "ALL", label: "All Users", icon: Users },
  { value: "CLIENTS", label: "Clients Only", icon: UserCheck },
  { value: "LAWYERS", label: "Lawyers Only", icon: Scale },
] as const;

export default function NotificationsPage() {
  // Send form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<string>("ALL");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // History state
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = async (p = 1) => {
    setHistoryLoading(true);
    try {
      const res = await api.get<{ data: AdminBroadcast[]; pagination: Pagination }>(
        `/admin/notifications/broadcast?page=${p}&limit=10`
      );
      setBroadcasts(res.data);
      setPagination(res.pagination);
      setPage(p);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
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
      fetchHistory();
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || "Failed to send notification" });
    } finally {
      setSending(false);
    }
  };

  const targetBadge = (t: string) => {
    switch (t) {
      case "CLIENTS":
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">Clients</Badge>;
      case "LAWYERS":
        return <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-xs">Lawyers</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">All Users</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Send broadcast push notifications to users</p>
      </div>

      {/* Send Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your notification message..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Result message */}
            {sendResult && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  sendResult.success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {sendResult.message}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Broadcast History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No broadcasts sent yet</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">Message</th>
                      <th className="pb-2 font-medium">Target</th>
                      <th className="pb-2 font-medium">Sent To</th>
                      <th className="pb-2 text-right font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {broadcasts.map((b) => (
                      <tr key={b.id}>
                        <td className="py-3 pr-4 font-medium">{b.title}</td>
                        <td className="max-w-xs truncate py-3 pr-4 text-muted-foreground">{b.body}</td>
                        <td className="py-3 pr-4">{targetBadge(b.target)}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className="text-xs">
                            {b.sentCount} user{b.sentCount !== 1 ? "s" : ""}
                          </Badge>
                        </td>
                        <td className="py-3 text-right text-xs text-muted-foreground">
                          {new Date(b.createdAt).toLocaleDateString()}{" "}
                          {new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchHistory(p)}
                      className={`h-8 w-8 rounded text-xs ${
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "border hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
