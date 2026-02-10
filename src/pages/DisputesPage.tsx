import { useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type AdminDispute, type Pagination } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-50 text-yellow-700",
  LAWYER_RESPONSE: "bg-blue-50 text-blue-700",
  MEDIATION: "bg-purple-50 text-purple-700",
  ESCALATED: "bg-red-50 text-red-700",
  RESOLVED: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-50 text-gray-700",
};

const RESOLUTION_TYPES = ["FULL_REFUND", "PARTIAL_REFUND", "NO_REFUND", "DISMISSED"] as const;

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionType, setResolutionType] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchData = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) params.set("status", filter);

    api
      .get<{ data: AdminDispute[]; pagination: Pagination }>(`/admin/disputes?${params}`)
      .then((res) => { setDisputes(res.data); setPagination(res.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setResolutionType("");
      setRefundAmount("");
      setResolutionNotes("");
      setNoteText("");
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
      fetchData(pagination?.page);
    } catch {}
    finally { setResolving(false); }
  };

  const handleAddNote = async (id: string) => {
    if (!noteText.trim()) return;
    try {
      setAddingNote(true);
      await api.post(`/admin/disputes/${id}/note`, { note: noteText });
      setNoteText("");
      fetchData(pagination?.page);
    } catch {}
    finally { setAddingNote(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
        <p className="text-sm text-muted-foreground">Manage client-lawyer disputes and resolutions</p>
      </div>

      <div className="flex items-center gap-2">
        {["", "OPEN", "MEDIATION", "ESCALATED", "RESOLVED", "CLOSED"].map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s || "All"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Lawyer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Filed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <>
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => toggleExpand(d.id)}>
                      <TableCell className="font-medium">{d.filedBy.firstName} {d.filedBy.lastName}</TableCell>
                      <TableCell>{d.filedAgainst.firstName} {d.filedAgainst.lastName}</TableCell>
                      <TableCell><Badge variant="secondary">{d.category}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {d.consultation.payment ? `$${(d.consultation.payment.amount / 100).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] || ""}`}>
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-7">
                          {expandedId === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expandedId === d.id && (
                      <TableRow key={`${d.id}-detail`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-6">
                          <div className="space-y-4">
                            {/* Description */}
                            <div>
                              <h4 className="text-sm font-medium mb-1">Description</h4>
                              <p className="text-sm text-muted-foreground">{d.description || "—"}</p>
                            </div>

                            {/* Metadata */}
                            <div className="flex gap-6 text-sm">
                              {d.resolutionType && (
                                <div>
                                  <span className="text-muted-foreground">Resolution: </span>
                                  <span className="font-medium">{d.resolutionType}</span>
                                </div>
                              )}
                              {d.resolutionNote && (
                                <div>
                                  <span className="text-muted-foreground">Note: </span>
                                  <span>{d.resolutionNote}</span>
                                </div>
                              )}
                              {d.resolvedAt && (
                                <div>
                                  <span className="text-muted-foreground">Resolved: </span>
                                  <span>{new Date(d.resolvedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                              {d.lawyerDeadline && (
                                <div>
                                  <span className="text-muted-foreground">Lawyer Deadline: </span>
                                  <span>{new Date(d.lawyerDeadline).toLocaleDateString()}</span>
                                </div>
                              )}
                              {d.mediationDeadline && (
                                <div>
                                  <span className="text-muted-foreground">Mediation Deadline: </span>
                                  <span>{new Date(d.mediationDeadline).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Resolution Form for ESCALATED disputes */}
                            {d.status === "ESCALATED" && (
                              <div className="rounded-lg border bg-background p-4 space-y-3">
                                <h4 className="text-sm font-semibold">Resolve Dispute</h4>

                                <div className="flex items-center gap-3">
                                  <label className="text-sm text-muted-foreground w-28">Resolution Type</label>
                                  <select
                                    className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={resolutionType}
                                    onChange={(e) => setResolutionType(e.target.value)}
                                  >
                                    <option value="">Select type...</option>
                                    {RESOLUTION_TYPES.map((t) => (
                                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                                    ))}
                                  </select>
                                </div>

                                {resolutionType === "PARTIAL_REFUND" && (
                                  <div className="flex items-center gap-3">
                                    <label className="text-sm text-muted-foreground w-28">Refund Amount</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="0.00"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                      />
                                      {d.consultation.payment && (
                                        <span className="text-xs text-muted-foreground">
                                          of ${(d.consultation.payment.amount / 100).toFixed(2)} paid
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-start gap-3">
                                  <label className="text-sm text-muted-foreground w-28 pt-2">Notes</label>
                                  <textarea
                                    className="flex min-h-[80px] w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Resolution notes..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                  />
                                </div>

                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    disabled={!resolutionType || resolving}
                                    onClick={(e) => { e.stopPropagation(); handleResolve(d.id); }}
                                  >
                                    {resolving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                                    Resolve Dispute
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Add Note */}
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">Add Note</label>
                                <textarea
                                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  placeholder="Add an admin note..."
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!noteText.trim() || addingNote}
                                onClick={(e) => { e.stopPropagation(); handleAddNote(d.id); }}
                              >
                                {addingNote ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
                                Add Note
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {disputes.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No disputes found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
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
