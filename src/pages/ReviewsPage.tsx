import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { api, type AdminReview, type Pagination } from "@/lib/api";
import { mockReviews } from "@/lib/mock-data";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (ratingFilter) params.set("rating", ratingFilter);

    const useMock = () => {
      let filtered = [...mockReviews];
      if (statusFilter) filtered = filtered.filter((r) => r.status === statusFilter);
      if (ratingFilter) filtered = filtered.filter((r) => r.rating === Number(ratingFilter));
      const start = (page - 1) * 20;
      setReviews(filtered.slice(start, start + 20));
      setPagination({ page, limit: 20, total: filtered.length, pages: Math.ceil(filtered.length / 20) });
    };

    api
      .get<{ data: AdminReview[]; pagination: Pagination }>(`/admin/reviews?${params}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setReviews(res.data);
          setPagination(res.pagination);
        } else {
          useMock();
        }
      })
      .catch(() => useMock())
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter, ratingFilter]);

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`, {});
      fetchData(pagination?.page);
    } catch {}
  };

  const handleReject = async () => {
    if (!rejectDialog.reviewId) return;
    try {
      await api.put(`/admin/reviews/${rejectDialog.reviewId}/reject`, { reason: rejectReason });
      setRejectDialog({ open: false, reviewId: null });
      setRejectReason("");
      fetchData(pagination?.page);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground">Review moderation and approval</p>
        </div>
        <div className="flex gap-2">
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
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
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
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Lawyer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <div>{r.reviewer.firstName} {r.reviewer.lastName}</div>
                        <div className="text-xs text-muted-foreground">{r.reviewer.email}</div>
                      </TableCell>
                      <TableCell>{r.lawyerProfile.user.firstName} {r.lawyerProfile.user.lastName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.consultation.category}</TableCell>
                      <TableCell><Stars rating={r.rating} /></TableCell>
                      <TableCell className="max-w-[250px]">
                        {r.comment ? (
                          <button
                            onClick={() => setExpandedComment(expandedComment === r.id ? null : r.id)}
                            className="flex items-start gap-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span className={expandedComment === r.id ? "" : "line-clamp-2"}>{r.comment}</span>
                            {r.comment.length > 60 && (
                              expandedComment === r.id
                                ? <ChevronUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                : <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            )}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] || ""}`}>
                          {r.status}
                        </span>
                        {r.rejectionReason && (
                          <p className="mt-1 text-xs text-muted-foreground">{r.rejectionReason}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {r.status === "PENDING" && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleApprove(r.id)}>
                              <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-red-600"
                              onClick={() => { setRejectDialog({ open: true, reviewId: r.id }); setRejectReason(""); }}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reviews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No reviews found</TableCell>
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
          {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === pagination.page ? "default" : "outline"} onClick={() => fetchData(p)}>{p}</Button>
          ))}
        </div>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) setRejectDialog({ open: false, reviewId: null }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
            <DialogDescription>Optionally provide a reason for rejecting this review.</DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, reviewId: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Review</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
