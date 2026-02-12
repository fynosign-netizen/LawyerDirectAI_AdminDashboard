import { useEffect, useState } from "react";
import { Search, Loader2, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type AdminUser, type Pagination } from "@/lib/api";

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [consultationFilter, setConsultationFilter] = useState("");

  const fetchUsers = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", role: "CLIENT" });
    if (search) params.set("search", search);

    api
      .get<{ data: AdminUser[]; pagination: Pagination }>(`/admin/users?${params}`)
      .then((res) => {
        let filtered = res.data;
        if (consultationFilter === "0") {
          filtered = filtered.filter((u) => u._count.consultationsAsClient === 0);
        } else if (consultationFilter === "1-5") {
          filtered = filtered.filter((u) => u._count.consultationsAsClient >= 1 && u._count.consultationsAsClient <= 5);
        } else if (consultationFilter === "5+") {
          filtered = filtered.filter((u) => u._count.consultationsAsClient > 5);
        }
        setUsers(filtered);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [consultationFilter]);

  const handleSuspend = async (id: string, suspended: boolean) => {
    try {
      await api.put(`/admin/users/${id}/suspend`, { suspended });
      fetchUsers(pagination?.page);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Manage platform clients</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <select
            value={consultationFilter}
            onChange={(e) => setConsultationFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Consultations</option>
            <option value="0">0 Consultations</option>
            <option value="1-5">1–5 Consultations</option>
            <option value="5+">5+ Consultations</option>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Consultations</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.suspended ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        {user.suspended && <Badge variant="destructive" className="mt-1 text-xs">Suspended</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{formatPhone(user.phone)}</TableCell>
                    <TableCell>{user._count.consultationsAsClient}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.suspended ? (
                        <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleSuspend(user.id, false)}>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" /> Unsuspend
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => handleSuspend(user.id, true)}>
                          <Ban className="mr-1 h-3.5 w-3.5" /> Suspend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No users found</TableCell>
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
            <Button key={p} size="sm" variant={p === pagination.page ? "default" : "outline"} onClick={() => fetchUsers(p)}>{p}</Button>
          ))}
        </div>
      )}
    </div>
  );
}
