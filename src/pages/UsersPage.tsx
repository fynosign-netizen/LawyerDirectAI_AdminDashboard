import { useEffect, useState } from "react";
import { Search, Loader2, Ban, CheckCircle, FileText, IdCard, XCircle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type AdminUser, type Pagination } from "@/lib/api";

const roleStyles: Record<string, string> = {
  LAWYER: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CLIENT: "bg-blue-50 text-blue-700 border-blue-200",
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [consultationFilter, setConsultationFilter] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsers = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    api
      .get<{ data: AdminUser[]; pagination: Pagination }>(`/admin/users?${params}`)
      .then((res) => {
        let filtered = res.data;
        // Client-side consultation count filter
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

  useEffect(() => { fetchUsers(); }, [roleFilter, consultationFilter]);

  const handleSuspend = async (id: string, suspended: boolean) => {
    try {
      await api.put(`/admin/users/${id}/suspend`, { suspended });
      fetchUsers(pagination?.page);
    } catch {}
  };

  const handleVerify = async (profileId: string, status: string) => {
    try {
      await api.put(`/admin/lawyers/${profileId}/verify`, { status });
      fetchUsers(pagination?.page);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Manage all platform users</p>
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Roles</option>
            <option value="CLIENT">Client</option>
            <option value="LAWYER">Lawyer</option>
            <option value="ADMIN">Admin</option>
          </select>
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
                  <TableHead>Role</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Consultations</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <>
                    <TableRow key={user.id} className={user.suspended ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          {user.suspended && <Badge variant="destructive" className="mt-1 text-xs">Suspended</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleStyles[user.role] || ""}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lawyerProfile ? (
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                            user.lawyerProfile.verificationStatus === "VERIFIED"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : user.lawyerProfile.verificationStatus === "REJECTED"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}>
                            {user.lawyerProfile.verificationStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{user._count.consultationsAsClient}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {user.lawyerProfile && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7"
                              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" /> Docs
                            </Button>
                          )}
                          {user.suspended ? (
                            <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleSuspend(user.id, false)}>
                              <CheckCircle className="mr-1 h-3.5 w-3.5" /> Unsuspend
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => handleSuspend(user.id, true)}>
                              <Ban className="mr-1 h-3.5 w-3.5" /> Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded document row */}
                    {expandedUser === user.id && user.lawyerProfile && (
                      <TableRow key={`${user.id}-docs`}>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="flex items-start gap-6 py-2">
                            {/* Bar License */}
                            <div className="text-center">
                              <p className="mb-1 text-xs font-medium">Bar License</p>
                              {user.lawyerProfile.licenseImage ? (
                                <button
                                  onClick={() => window.open(user.lawyerProfile!.licenseImage!, "_blank")}
                                  className="overflow-hidden rounded border transition hover:border-indigo-400"
                                >
                                  <img src={user.lawyerProfile.licenseImage} alt="Bar License" className="h-20 w-28 object-cover" />
                                </button>
                              ) : (
                                <div className="flex h-20 w-28 items-center justify-center rounded border border-dashed text-muted-foreground">
                                  <FileText className="h-6 w-6" />
                                </div>
                              )}
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {user.lawyerProfile.licenseImage ? "Click to view full" : "Not uploaded"}
                              </p>
                            </div>

                            {/* Government ID */}
                            <div className="text-center">
                              <p className="mb-1 text-xs font-medium">Government ID</p>
                              {user.lawyerProfile.idImage ? (
                                <button
                                  onClick={() => window.open(user.lawyerProfile!.idImage!, "_blank")}
                                  className="overflow-hidden rounded border transition hover:border-indigo-400"
                                >
                                  <img src={user.lawyerProfile.idImage} alt="Government ID" className="h-20 w-28 object-cover" />
                                </button>
                              ) : (
                                <div className="flex h-20 w-28 items-center justify-center rounded border border-dashed text-muted-foreground">
                                  <IdCard className="h-6 w-6" />
                                </div>
                              )}
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {user.lawyerProfile.idImage ? "Click to view full" : "Not uploaded"}
                              </p>
                            </div>

                            {/* Info */}
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Bar #:</span> {user.lawyerProfile.barNumber || "N/A"}</p>
                              <p><span className="text-muted-foreground">State:</span> {user.lawyerProfile.licenseState || "N/A"}</p>
                            </div>

                            {/* Verify / Reject buttons */}
                            <div className="ml-auto flex flex-col gap-1">
                              {user.lawyerProfile.verificationStatus !== "VERIFIED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => handleVerify(user.lawyerProfile!.id, "VERIFIED")}
                                >
                                  <CheckCircle className="mr-1 h-3.5 w-3.5" /> Mark Verified
                                </Button>
                              )}
                              {user.lawyerProfile.verificationStatus !== "REJECTED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleVerify(user.lawyerProfile!.id, "REJECTED")}
                                >
                                  <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No users found</TableCell>
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
