import { useEffect, useState, useCallback } from "react";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type AdminConsultation, type Pagination } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  TRIAL: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-green-50 text-green-700",
  COMPLETED: "bg-gray-50 text-gray-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const CATEGORIES = [
  "Real Estate", "Family Law", "Employment Law", "Business & Contract",
  "Personal Injury", "Criminal Defense", "Immigration", "Intellectual Property",
  "Tax Law", "Estate Planning",
];

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<AdminConsultation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateApplied, setDateApplied] = useState(false);

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (search) params.set("search", search);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    api
      .get<{ data: AdminConsultation[]; pagination: Pagination }>(`/admin/consultations?${params}`)
      .then((res) => { setConsultations(res.data); setPagination(res.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, search, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [statusFilter, categoryFilter]);

  const handleSearch = () => fetchData();

  const applyDateFilter = () => {
    setDateApplied(true);
    fetchData();
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setDateApplied(false);
    setTimeout(() => fetchData(), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consultations</h1>
        <p className="text-sm text-muted-foreground">All platform consultations</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search client or lawyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Date range */}
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

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultations.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.client.firstName} {c.client.lastName}</TableCell>
                    <TableCell>{c.lawyer ? `${c.lawyer.user.firstName} ${c.lawyer.user.lastName}` : "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{c.category}</Badge></TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || ""}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell>{c.payment ? `$${(c.payment.amount / 100).toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {consultations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No consultations found</TableCell>
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
    </div>
  );
}
