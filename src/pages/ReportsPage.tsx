import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type AdminReport, type Pagination } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  REVIEWING: "bg-blue-50 text-blue-700",
  RESOLVED: "bg-green-50 text-green-700",
  DISMISSED: "bg-gray-50 text-gray-700",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchData = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) params.set("status", filter);

    api
      .get<{ data: AdminReport[]; pagination: Pagination }>(`/admin/reports?${params}`)
      .then((res) => { setReports(res.data); setPagination(res.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleUpdate = async (id: string, status: string, resolution?: string) => {
    try {
      await api.put(`/admin/reports/${id}`, { status, resolution });
      fetchData(pagination?.page);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">User reports and moderation</p>
      </div>

      <div className="flex items-center gap-2">
        {["", "PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].map((s) => (
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
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.reporter.firstName} {r.reporter.lastName}</TableCell>
                    <TableCell>{r.reported.firstName} {r.reported.lastName}</TableCell>
                    <TableCell><Badge variant="secondary">{r.reason}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{r.description || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] || ""}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {(r.status === "PENDING" || r.status === "REVIEWING") && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleUpdate(r.id, "RESOLVED", "Action taken")}>
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Resolve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-gray-500" onClick={() => handleUpdate(r.id, "DISMISSED")}>
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Dismiss
                          </Button>
                        </div>
                      )}
                      {r.resolution && (
                        <p className="text-xs text-muted-foreground mt-1">{r.resolution}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No reports found</TableCell></TableRow>
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
