import { useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type AdminTicket, type Pagination } from "@/lib/api";
import { mockTickets } from "@/lib/mock-data";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-orange-50 text-orange-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  RESOLVED: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-50 text-gray-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  BILLING: "bg-emerald-50 text-emerald-700",
  TECHNICAL: "bg-sky-50 text-sky-700",
  ACCOUNT: "bg-violet-50 text-violet-700",
  LEGAL: "bg-amber-50 text-amber-700",
  OTHER: "bg-gray-50 text-gray-600",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);

    const useMock = () => {
      let filtered = mockTickets as AdminTicket[];
      if (statusFilter) filtered = filtered.filter((t) => t.status === statusFilter);
      if (categoryFilter) filtered = filtered.filter((t) => t.category === categoryFilter);
      const start = (page - 1) * 20;
      setTickets(filtered.slice(start, start + 20));
      setPagination({ page, limit: 20, total: filtered.length, pages: Math.ceil(filtered.length / 20) });
    };

    api
      .get<{ data: AdminTicket[]; pagination: Pagination }>(`/admin/tickets?${params}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setTickets(res.data);
          setPagination(res.pagination);
        } else {
          useMock();
        }
      })
      .catch(() => useMock())
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter, categoryFilter]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setReplyText("");
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    try {
      setReplying(true);
      await api.post(`/admin/tickets/${ticketId}/replies`, { message: replyText.trim() });
      setReplyText("");
      fetchData(pagination?.page);
    } catch {}
    finally { setReplying(false); }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/admin/tickets/${ticketId}/status`, { status });
      fetchData(pagination?.page);
    } catch {}
    finally { setUpdatingStatus(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Manage and respond to user support tickets</p>
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            <option value="BILLING">Billing</option>
            <option value="TECHNICAL">Technical</option>
            <option value="ACCOUNT">Account</option>
            <option value="LEGAL">Legal</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Replies</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <>
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => toggleExpand(t.id)}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{t.user.firstName} {t.user.lastName}</span>
                          <p className="text-xs text-muted-foreground">{t.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="truncate block text-sm">{t.subject}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[t.category] || ""}`}>
                          {t.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] || ""}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t._count.replies}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-7">
                          {expandedId === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expandedId === t.id && (
                      <TableRow key={`${t.id}-detail`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-6">
                          <div className="space-y-4">
                            {/* Description */}
                            <div>
                              <h4 className="text-sm font-medium mb-1">Description</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.description}</p>
                            </div>

                            {/* Metadata */}
                            <div className="flex gap-6 text-sm flex-wrap">
                              <div>
                                <span className="text-muted-foreground">Role: </span>
                                <Badge variant="secondary" className="text-xs">{t.user.role}</Badge>
                              </div>
                              {t.resolvedAt && (
                                <div>
                                  <span className="text-muted-foreground">Resolved: </span>
                                  <span>{new Date(t.resolvedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Reply Thread */}
                            {t.replies && t.replies.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Replies</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto rounded-md border bg-background p-3">
                                  {t.replies.map((r) => (
                                    <div key={r.id} className={`rounded-lg p-3 text-sm ${r.isAdmin ? "bg-primary/5 border border-primary/10" : "bg-muted"}`}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className={`font-medium text-xs ${r.isAdmin ? "text-primary" : ""}`}>
                                          {r.isAdmin ? "Admin" : `${r.user.firstName} ${r.user.lastName}`}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(r.createdAt).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground whitespace-pre-wrap">{r.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Reply Form */}
                            {t.status !== "CLOSED" && (
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <label className="text-sm font-medium mb-1 block">Reply</label>
                                  <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Type your reply to the user..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  disabled={!replyText.trim() || replying}
                                  onClick={(e) => { e.stopPropagation(); handleReply(t.id); }}
                                >
                                  {replying ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
                                  Send Reply
                                </Button>
                              </div>
                            )}

                            {/* Status Actions */}
                            {t.status !== "CLOSED" && (
                              <div className="flex gap-2 pt-2 border-t">
                                {t.status === "OPEN" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={updatingStatus}
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, "IN_PROGRESS"); }}
                                  >
                                    <Clock className="mr-1 h-3.5 w-3.5" />
                                    Mark In Progress
                                  </Button>
                                )}
                                {(t.status === "OPEN" || t.status === "IN_PROGRESS") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    disabled={updatingStatus}
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, "RESOLVED"); }}
                                  >
                                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                    Resolve
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={updatingStatus}
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, "CLOSED"); }}
                                >
                                  <XCircle className="mr-1 h-3.5 w-3.5" />
                                  Close
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {tickets.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No tickets found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === pagination.page ? "default" : "outline"} onClick={() => fetchData(p)}>{p}</Button>
          ))}
        </div>
      )}
    </div>
  );
}
