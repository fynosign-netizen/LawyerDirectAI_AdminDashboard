import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type AdminDataRequest, type Pagination } from "@/lib/api";

const STATUS_CLASSES: Record<AdminDataRequest["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

export default function DataRequestsPage() {
  const [requests, setRequests] = useState<AdminDataRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRequests = useCallback((page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);

    api
      .get<{ data: AdminDataRequest[]; pagination: Pagination }>(`/admin/data-requests?${params}`)
      .then((res) => {
        setRequests(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load data requests.");
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    const actionLabel = status === "APPROVED" ? "approve" : "reject";
    const confirmed = window.confirm(`Are you sure you want to ${actionLabel} this data request?`);

    if (!confirmed) return;

    try {
      setActioningId(requestId);
      setError(null);
      setSuccess(null);
      const response = await api.put<{ data: AdminDataRequest; message?: string }>(
        `/admin/data-requests/${requestId}`,
        { status }
      );
      setSuccess(
        response.message || (status === "APPROVED"
          ? "Data request approved and emailed."
          : "Data request rejected.")
      );
      fetchRequests(pagination?.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the data request.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and process user requests for personal data exports.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

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
                    <TableHead>User Name</TableHead>
                    <TableHead>User Email</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Request Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const isActioning = actioningId === request.id;

                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.user.firstName} {request.user.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{request.userEmail}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{request.userId}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(request.requestTimestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[request.status]}`}>
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === "PENDING" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 hover:text-emerald-700"
                                disabled={isActioning}
                                onClick={() => handleAction(request.id, "APPROVED")}
                              >
                                {isActioning ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700"
                                disabled={isActioning}
                                onClick={() => handleAction(request.id, "REJECTED")}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {request.processedAt
                                ? `Processed ${new Date(request.processedAt).toLocaleDateString()}`
                                : "No actions available"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No data requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === pagination.page ? "default" : "outline"}
              onClick={() => fetchRequests(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
