import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Eye, AlertTriangle, User, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { api, type AdminReport, type Pagination } from "@/lib/api";
import { mockReports } from "@/lib/mock-data";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  REVIEWED: { label: "Reviewed", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ACTIONED: { label: "Actioned", className: "bg-green-100 text-green-800 border-green-200" },
  DISMISSED: { label: "Dismissed", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const REASON_CONFIG: Record<string, string> = {
  SPAM: "bg-orange-100 text-orange-700",
  HARASSMENT: "bg-red-100 text-red-700",
  FRAUD: "bg-purple-100 text-purple-700",
  INAPPROPRIATE_CONTENT: "bg-pink-100 text-pink-700",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  const fetchData = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) params.set("status", filter);

    const useMock = () => {
      const filtered = filter ? mockReports.filter((r) => r.status === filter) : mockReports;
      const start = (page - 1) * 20;
      setReports(filtered.slice(start, start + 20));
      setPagination({ page, limit: 20, total: filtered.length, pages: Math.ceil(filtered.length / 20) });
    };

    api
      .get<{ data: AdminReport[]; pagination: Pagination }>(`/admin/reports?${params}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setReports(res.data);
          setPagination(res.pagination);
        } else {
          useMock();
        }
      })
      .catch(() => useMock())
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleUpdate = async (id: string, status: string, resolution?: string) => {
    try {
      await api.put(`/admin/reports/${id}`, { status, resolution });
      if (selectedReport?.id === id) setSelectedReport(null);
      fetchData(pagination?.page);
    } catch {}
  };

  const statusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, className: "" };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const reasonBadge = (reason: string) => {
    const colorClass = REASON_CONFIG[reason] || "bg-secondary text-secondary-foreground";
    const label = reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">User reports and moderation</p>
        </div>
        <div className="flex items-center gap-3">
          {pagination && (
            <span className="text-sm text-muted-foreground">
              {pagination.total} report{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
                    <TableHead className="w-[180px]">Reporter</TableHead>
                    <TableHead className="w-[180px]">Reported User</TableHead>
                    <TableHead className="w-[160px]">Reason</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="w-[220px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium text-sm">{r.reporter.firstName} {r.reporter.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm">{r.reported.firstName} {r.reported.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{reasonBadge(r.reason)}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 px-3"
                            onClick={() => setSelectedReport(r)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {(r.status === "PENDING" || r.status === "REVIEWED") && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 px-3 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleUpdate(r.id, "ACTIONED", "Action taken")}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 px-3 text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-600"
                                onClick={() => handleUpdate(r.id, "DISMISSED")}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Dismiss
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <AlertTriangle className="h-8 w-8 opacity-40" />
                          <p>No reports found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === pagination.page ? "default" : "outline"} onClick={() => fetchData(p)}>{p}</Button>
          ))}
        </div>
      )}

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[520px]">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-lg">Report Details</DialogTitle>
                  {statusBadge(selectedReport.status)}
                </div>
                <DialogDescription>
                  Submitted on {new Date(selectedReport.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Reporter */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reporter</p>
                    <p className="text-sm font-medium">{selectedReport.reporter.firstName} {selectedReport.reporter.lastName}</p>
                  </div>
                </div>

                {/* Reported User */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reported User</p>
                    <p className="text-sm font-medium">{selectedReport.reported.firstName} {selectedReport.reported.lastName}</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reason</p>
                    <div className="mt-1">{reasonBadge(selectedReport.reason)}</div>
                  </div>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                      <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                    </div>
                  </div>
                )}

                {/* Resolution */}
                {selectedReport.resolution && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Resolution</p>
                    <p className="text-sm">{selectedReport.resolution}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {(selectedReport.status === "PENDING" || selectedReport.status === "REVIEWED") && (
                <DialogFooter className="gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="gap-1.5 text-gray-500 border-gray-200 hover:bg-gray-50"
                    onClick={() => handleUpdate(selectedReport.id, "DISMISSED")}
                  >
                    <XCircle className="h-4 w-4" />
                    Dismiss
                  </Button>
                  <Button
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleUpdate(selectedReport.id, "ACTIONED", "Action taken")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Resolve
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
