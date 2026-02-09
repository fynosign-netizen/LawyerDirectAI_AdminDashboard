import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type AdminLawyer, type Pagination } from "@/lib/api";

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<AdminLawyer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const fetchLawyers = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filter) params.set("verification", filter);

    api
      .get<{ data: AdminLawyer[]; pagination: Pagination }>(`/admin/lawyers?${params}`)
      .then((res) => {
        setLawyers(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLawyers();
  }, [filter]);

  const handleVerify = async (id: string, status: string) => {
    try {
      await api.put(`/admin/lawyers/${id}/verify`, { status });
      fetchLawyers(pagination?.page);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lawyers</h1>
        <p className="text-sm text-muted-foreground">Manage lawyer profiles and verification</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lawyers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLawyers()}
            className="pl-9"
          />
        </div>
        {["", "PENDING", "VERIFIED", "REJECTED"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f || "All"}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Bar #</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lawyers.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{l.user.firstName} {l.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{l.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{l.barNumber}</TableCell>
                    <TableCell>{l.licenseState}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {l.specializations.slice(0, 2).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {l.specializations.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{l.specializations.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{l.rating.toFixed(1)} ({l._count.reviews})</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${VERIFICATION_COLORS[l.verificationStatus] || ""}`}>
                        {l.verificationStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {l.verificationStatus === "PENDING" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleVerify(l.id, "VERIFIED")}>
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Verify
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => handleVerify(l.id, "REJECTED")}>
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {lawyers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No lawyers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === pagination.page ? "default" : "outline"}
              onClick={() => fetchLawyers(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
