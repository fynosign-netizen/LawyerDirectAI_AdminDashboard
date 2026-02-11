import { useEffect, useState, useCallback } from "react";
import { Loader2, DollarSign, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type AdminPayment, type Pagination } from "@/lib/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateApplied, setDateApplied] = useState(false);

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) params.set("status", filter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    api
      .get<{ data: AdminPayment[]; totalAmount: number; pagination: Pagination }>(`/admin/payments?${params}`)
      .then((res) => { setPayments(res.data); setTotalAmount(res.totalAmount); setPagination(res.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [filter]);

  const applyDateFilter = () => {
    setDateApplied(true);
    fetchData();
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setDateApplied(false);
    // Will re-fetch without dates on next effect
    setTimeout(() => fetchData(), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">Platform payment transactions</p>
        </div>
        <Card className="px-4 py-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-lg font-semibold">${totalAmount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
          <button
            onClick={applyDateFilter}
            disabled={loading || (!fromDate && !toDate)}
            className="flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Filter
          </button>
          {dateApplied && (
            <button
              onClick={clearDateFilter}
              className="h-9 rounded-md border px-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>
        <div className="ml-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
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
                  <TableHead>Client</TableHead>
                  <TableHead>Lawyer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.consultation.client.firstName} {p.consultation.client.lastName}</TableCell>
                    <TableCell>{p.consultation.lawyer ? `${p.consultation.lawyer.user.firstName} ${p.consultation.lawyer.user.lastName}` : "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{p.consultation.category}</Badge></TableCell>
                    <TableCell className="font-semibold">${(p.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "COMPLETED" ? "default" : "secondary"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No payments found</TableCell></TableRow>
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
