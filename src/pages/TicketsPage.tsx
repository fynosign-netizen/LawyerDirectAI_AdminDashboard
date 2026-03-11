import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  MessageCircleMore,
  Search,
  Send,
  ShieldAlert,
  Ticket,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  api,
  type AdminDispute,
  type AdminSupportItem,
  type AdminTicket,
  type Pagination,
} from "@/lib/api";
import { mockDisputes, mockTickets } from "@/lib/mock-data";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-orange-50 text-orange-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  RESOLVED: "bg-green-50 text-green-700",
  CLOSED: "bg-slate-100 text-slate-700",
  LAWYER_RESPONSE: "bg-sky-50 text-sky-700",
  MEDIATION: "bg-violet-50 text-violet-700",
  ESCALATED: "bg-red-50 text-red-700",
};

const TYPE_COLORS: Record<AdminSupportItem["itemType"], string> = {
  TICKET: "bg-blue-50 text-blue-700",
  DISPUTE: "bg-red-50 text-red-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  BILLING: "bg-emerald-50 text-emerald-700",
  TECHNICAL: "bg-sky-50 text-sky-700",
  ACCOUNT: "bg-violet-50 text-violet-700",
  LEGAL: "bg-amber-50 text-amber-700",
  DISPUTE: "bg-rose-50 text-rose-700",
  QUALITY: "bg-indigo-50 text-indigo-700",
  COMMUNICATION: "bg-cyan-50 text-cyan-700",
  CONDUCT: "bg-red-50 text-red-700",
  INCOMPLETE: "bg-orange-50 text-orange-700",
  OTHER: "bg-slate-100 text-slate-700",
};

const RESOLUTION_TYPES = ["FULL_REFUND", "PARTIAL_REFUND", "NO_REFUND", "DISMISSED"] as const;
const ACTIVE_STATUSES = new Set(["OPEN", "IN_PROGRESS", "LAWYER_RESPONSE", "MEDIATION", "ESCALATED"]);

type TypeFilter = "" | "TICKET" | "DISPUTE";
type StateFilter = "" | "ACTIVE" | "RESOLVED";

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatCategory(value: string) {
  return value.replace(/_/g, " ");
}

function formatCurrency(cents?: number | null) {
  if (!cents) return "No charge";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function truncateText(value: string, max = 180) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function isItemActive(item: AdminSupportItem) {
  return ACTIVE_STATUSES.has(item.status);
}

function buildSupportItemFromTicket(ticket: AdminTicket): AdminSupportItem {
  return {
    id: ticket.id,
    itemType: "TICKET",
    status: ticket.status,
    category: ticket.category,
    title: ticket.subject,
    description: ticket.description,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
    activityCount: ticket._count?.replies || ticket.replies?.length || 0,
    user: ticket.user,
    replies: ticket.replies || [],
  };
}

function buildSupportItemFromDispute(dispute: AdminDispute): AdminSupportItem {
  return {
    id: dispute.id,
    itemType: "DISPUTE",
    status: dispute.status,
    category: dispute.category,
    title: dispute.consultation?.category || "Consultation dispute",
    description: dispute.description,
    createdAt: dispute.createdAt,
    updatedAt: dispute.resolvedAt || dispute.createdAt,
    resolvedAt: dispute.resolvedAt,
    activityCount: 0,
    filedBy: dispute.filedBy,
    filedAgainst: dispute.filedAgainst,
    consultation: dispute.consultation,
    resolutionType: dispute.resolutionType,
    resolutionNote: dispute.resolutionNote,
    refundAmount: dispute.refundAmount,
    lawyerDeadline: dispute.lawyerDeadline,
    mediationDeadline: dispute.mediationDeadline,
    timeline: [],
  };
}

function buildMockSupportItems() {
  return [...mockTickets.map(buildSupportItemFromTicket), ...mockDisputes.map(buildSupportItemFromDispute)]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function filterSupportItems(items: AdminSupportItem[], typeFilter: TypeFilter, stateFilter: StateFilter, search: string) {
  const query = search.trim().toLowerCase();

  return items.filter((item) => {
    if (typeFilter && item.itemType !== typeFilter) return false;
    if (stateFilter === "ACTIVE" && !isItemActive(item)) return false;
    if (stateFilter === "RESOLVED" && isItemActive(item)) return false;

    if (!query) return true;

    const haystack = [
      item.title,
      item.description,
      item.category,
      item.user?.firstName,
      item.user?.lastName,
      item.user?.email,
      item.filedBy?.firstName,
      item.filedBy?.lastName,
      item.filedAgainst?.firstName,
      item.filedAgainst?.lastName,
      item.consultation?.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export default function TicketsPage() {
  const [items, setItems] = useState<AdminSupportItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionType, setResolutionType] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchData = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (typeFilter) params.set("type", typeFilter);
    if (stateFilter) params.set("state", stateFilter);
    if (search.trim()) params.set("search", search.trim());

    const useMock = () => {
      const filtered = filterSupportItems(buildMockSupportItems(), typeFilter, stateFilter, search);
      const start = (page - 1) * 20;

      setItems(filtered.slice(start, start + 20));
      setPagination({
        page,
        limit: 20,
        total: filtered.length,
        pages: Math.ceil(filtered.length / 20),
      });
    };

    api
      .get<{ data: AdminSupportItem[]; pagination: Pagination }>(`/admin/tickets/feed?${params}`)
      .then((res) => {
        if (res.data) {
          setItems(res.data);
          setPagination(res.pagination);
          return;
        }

        useMock();
      })
      .catch(() => useMock())
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(1);
  }, [typeFilter, stateFilter, search]);

  const summary = useMemo(() => {
    const active = items.filter((item) => isItemActive(item)).length;
    const tickets = items.filter((item) => item.itemType === "TICKET").length;
    const disputes = items.filter((item) => item.itemType === "DISPUTE").length;
    const escalated = items.filter((item) => item.status === "ESCALATED").length;

    return { active, tickets, disputes, escalated };
  }, [items]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    setReplyText("");
    setResolutionType("");
    setRefundAmount("");
    setResolutionNotes("");
    setNoteText("");
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;

    try {
      setReplying(true);
      await api.post(`/admin/tickets/${ticketId}/replies`, { message: replyText.trim() });
      setReplyText("");
      fetchData(pagination?.page || 1);
    } catch {}
    finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/admin/tickets/${ticketId}/status`, { status });
      fetchData(pagination?.page || 1);
    } catch {}
    finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      setResolving(true);
      await api.put(`/admin/disputes/${id}/resolve`, {
        resolutionType,
        resolutionNote: resolutionNotes,
        refundAmount: resolutionType === "PARTIAL_REFUND" ? Number(refundAmount) : undefined,
      });
      setExpandedId(null);
      fetchData(pagination?.page || 1);
    } catch {}
    finally {
      setResolving(false);
    }
  };

  const handleAddNote = async (id: string) => {
    if (!noteText.trim()) return;

    try {
      setAddingNote(true);
      await api.post(`/admin/disputes/${id}/note`, { note: noteText.trim() });
      setNoteText("");
      fetchData(pagination?.page || 1);
    } catch {}
    finally {
      setAddingNote(false);
    }
  };

  const renderTicketDetail = (item: AdminSupportItem) => (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-2 text-sm font-medium">Submitted by</div>
          <div className="text-sm font-medium">
            {item.user?.firstName} {item.user?.lastName}
          </div>
          <div className="text-sm text-muted-foreground">{item.user?.email}</div>
          {item.user?.role && (
            <Badge variant="secondary" className="mt-3 text-xs">{item.user.role}</Badge>
          )}
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="mb-2 text-sm font-medium">Description</div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Conversation</div>
          <div className="text-xs text-muted-foreground">{item.activityCount} replies</div>
        </div>

        {item.replies && item.replies.length > 0 ? (
          <div className="space-y-3">
            {item.replies.map((reply) => (
              <div
                key={reply.id}
                className={`rounded-xl border p-3 text-sm ${reply.isAdmin ? "border-primary/20 bg-primary/5" : "bg-muted/70"}`}
              >
                <div className="mb-1 flex items-center justify-between gap-4">
                  <span className="font-medium">
                    {reply.isAdmin ? "Admin" : `${reply.user.firstName} ${reply.user.lastName}`}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(reply.createdAt)}</span>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No replies yet.
          </div>
        )}
      </div>

      {item.status !== "CLOSED" && (
        <div className="space-y-3 rounded-xl border bg-background p-4">
          <div className="text-sm font-medium">Reply</div>
          <textarea
            className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Type your reply to the user..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button size="sm" disabled={!replyText.trim() || replying} onClick={() => handleReply(item.id)}>
              {replying ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
              Send Reply
            </Button>

            {item.status === "OPEN" && (
              <Button
                size="sm"
                variant="outline"
                disabled={updatingStatus}
                onClick={() => handleStatusChange(item.id, "IN_PROGRESS")}
              >
                <Clock3 className="mr-1 h-3.5 w-3.5" />
                Mark In Progress
              </Button>
            )}

            {(item.status === "OPEN" || item.status === "IN_PROGRESS") && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-700"
                disabled={updatingStatus}
                onClick={() => handleStatusChange(item.id, "RESOLVED")}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Resolve
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="text-red-700"
              disabled={updatingStatus}
              onClick={() => handleStatusChange(item.id, "CLOSED")}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderDisputeDetail = (item: AdminSupportItem) => (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-2 text-sm font-medium">Parties</div>
          <div className="text-sm font-medium">
            {item.filedBy?.firstName} {item.filedBy?.lastName}
          </div>
          <div className="text-xs text-muted-foreground">Client</div>
          <div className="mt-3 text-sm font-medium">
            {item.filedAgainst?.firstName} {item.filedAgainst?.lastName}
          </div>
          <div className="text-xs text-muted-foreground">Lawyer</div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="mb-2 text-sm font-medium">Consultation</div>
          <div className="text-sm">{item.consultation?.category || "Unknown category"}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Payment: {formatCurrency(item.consultation?.payment?.amount)}
          </div>
          {item.consultation?.status && (
            <div className="mt-2 text-sm text-muted-foreground">
              Status: {formatStatus(item.consultation.status)}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="mb-2 text-sm font-medium">Deadlines</div>
          <div className="text-sm text-muted-foreground">
            Lawyer: {formatDateTime(item.lawyerDeadline) || "Not set"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Mediation: {formatDateTime(item.mediationDeadline) || "Not set"}
          </div>
          {item.resolvedAt && (
            <div className="mt-2 text-sm text-muted-foreground">
              Resolved: {formatDateTime(item.resolvedAt)}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="mb-2 text-sm font-medium">Description</div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
      </div>

      {(item.resolutionType || item.resolutionNote || item.refundAmount) && (
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-2 text-sm font-medium">Resolution</div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {item.resolutionType && <span>Type: {formatStatus(item.resolutionType)}</span>}
            {typeof item.refundAmount === "number" && <span>Refund: {formatCurrency(item.refundAmount)}</span>}
          </div>
          {item.resolutionNote && (
            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{item.resolutionNote}</p>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Timeline</div>
          <div className="text-xs text-muted-foreground">{item.activityCount} updates</div>
        </div>

        {item.timeline && item.timeline.length > 0 ? (
          <div className="space-y-3">
            {item.timeline.map((entry) => (
              <div key={entry.id} className="rounded-xl border bg-muted/40 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-4">
                  <span className="font-medium">
                    {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : "System"}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{entry.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No timeline entries yet.
          </div>
        )}
      </div>

      {item.status === "ESCALATED" && (
        <div className="space-y-3 rounded-xl border bg-background p-4">
          <div className="text-sm font-medium">Resolve Dispute</div>
          <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <label className="text-sm text-muted-foreground">Resolution Type</label>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value)}
            >
              <option value="">Select type...</option>
              {RESOLUTION_TYPES.map((type) => (
                <option key={type} value={type}>{formatStatus(type)}</option>
              ))}
            </select>
          </div>

          {resolutionType === "PARTIAL_REFUND" && (
            <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
              <label className="text-sm text-muted-foreground">Refund Amount</label>
              <input
                type="number"
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="0.00"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
            <label className="pt-2 text-sm text-muted-foreground">Resolution Notes</label>
            <textarea
              className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Explain the outcome and any refund decision..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button disabled={!resolutionType || !resolutionNotes.trim() || resolving} onClick={() => handleResolve(item.id)}>
              {resolving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Resolve Dispute
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-xl border bg-background p-4">
        <div className="text-sm font-medium">Add Admin Note</div>
        <textarea
          className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Add an internal dispute note..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
        <div className="flex justify-end">
          <Button variant="outline" disabled={!noteText.trim() || addingNote} onClick={() => handleAddNote(item.id)}>
            {addingNote ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Tickets and disputes now share the same queue for faster review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", "TICKET", "DISPUTE"] as TypeFilter[]).map((value) => (
            <Button
              key={value || "all-types"}
              size="sm"
              variant={typeFilter === value ? "default" : "outline"}
              onClick={() => setTypeFilter(value)}
            >
              {value === "" ? "All Types" : value === "TICKET" ? "Tickets" : "Disputes"}
            </Button>
          ))}
          {(["", "ACTIVE", "RESOLVED"] as StateFilter[]).map((value) => (
            <Button
              key={value || "all-states"}
              size="sm"
              variant={stateFilter === value ? "default" : "outline"}
              onClick={() => setStateFilter(value)}
            >
              {value === "" ? "All States" : value === "ACTIVE" ? "Active" : "Resolved"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{summary.active}</div>
              <div className="text-sm text-muted-foreground">Active items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{summary.tickets}</div>
              <div className="text-sm text-muted-foreground">Tickets on page</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-rose-50 p-2 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{summary.disputes}</div>
              <div className="text-sm text-muted-foreground">Disputes on page</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{summary.escalated}</div>
              <div className="text-sm text-muted-foreground">Escalated disputes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject, description, client, lawyer, or category"
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {pagination ? `${pagination.total} total items` : "No items loaded"}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <Card key={`${item.itemType}-${item.id}`} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="space-y-4 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={TYPE_COLORS[item.itemType]}>
                              {item.itemType === "TICKET" ? "Ticket" : "Dispute"}
                            </Badge>
                            <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER}>
                              {formatCategory(item.category)}
                            </Badge>
                            <Badge className={STATUS_COLORS[item.status] || STATUS_COLORS.CLOSED}>
                              {formatStatus(item.status)}
                            </Badge>
                          </div>

                          <div>
                            <h2 className="text-lg font-semibold">{item.title}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.itemType === "TICKET"
                                ? `${item.user?.firstName || "Unknown"} ${item.user?.lastName || "user"}${item.user?.email ? ` - ${item.user.email}` : ""}`
                                : `${item.filedBy?.firstName || "Client"} ${item.filedBy?.lastName || ""} vs ${item.filedAgainst?.firstName || "Lawyer"} ${item.filedAgainst?.lastName || ""}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="text-right">
                            <div>Updated {formatDate(item.updatedAt)}</div>
                            <div className="mt-1">
                              {item.itemType === "TICKET" ? `${item.activityCount} replies` : `${item.activityCount} updates`}
                            </div>
                          </div>
                          <div className="rounded-full border p-2">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <p className="max-w-4xl text-sm text-muted-foreground">{truncateText(item.description)}</p>
                        {item.itemType === "DISPUTE" && item.consultation?.payment && (
                          <div className="text-sm font-medium text-foreground">
                            {formatCurrency(item.consultation.payment.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/20 p-5">
                      {item.itemType === "TICKET" ? renderTicketDetail(item) : renderDisputeDetail(item)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <Card>
              <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No tickets or disputes found for the current filters.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(pagination.pages, 10) }, (_, index) => index + 1).map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === pagination.page ? "default" : "outline"}
              onClick={() => fetchData(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
