import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Search, Eye, ChevronDown, FileText, IdCard, Phone, Mail, Star, Calendar, MapPin, Briefcase, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api, type AdminLawyer, type Pagination } from "@/lib/api";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  if (local.length === 10) {
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return phone;
}

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

const SPECIALIZATIONS = [
  "Immigration","Family Law","Criminal Defense","Real Estate",
  "Business & Contract","Employment","Personal Injury","Bankruptcy",
  "Intellectual Property","Tax Law","Estate Planning","Small Claims",
  "Landlord/Tenant","Consumer Protection",
];

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<AdminLawyer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [specFilter, setSpecFilter] = useState<string[]>([]);
  const [specDropdownOpen, setSpecDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  // Modal state
  const [selectedLawyer, setSelectedLawyer] = useState<AdminLawyer | null>(null);

  // Image lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchLawyers = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filter) params.set("verification", filter);
    if (stateFilter) params.set("state", stateFilter);
    if (specFilter.length) params.set("specializations", specFilter.join(","));
    if (sortBy) params.set("sort", sortBy);
    if (ratingFilter) params.set("minRating", ratingFilter);

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
  }, [filter, stateFilter, specFilter, sortBy, ratingFilter]);

  const handleVerify = async (id: string, status: string) => {
    try {
      await api.put(`/admin/lawyers/${id}/verify`, { status });
      setSelectedLawyer(null);
      fetchLawyers(pagination?.page);
    } catch {}
  };

  const toggleSpec = (spec: string) => {
    setSpecFilter((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lawyers</h1>
        <p className="text-sm text-muted-foreground">Manage lawyer profiles and verification</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Specializations multi-select */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSpecDropdownOpen((o) => !o)}
              className="flex h-9 items-center gap-1 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {specFilter.length > 0 ? `${specFilter.length} Specialization${specFilter.length > 1 ? "s" : ""}` : "Specializations"}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {specDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSpecDropdownOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border bg-background py-1 shadow-lg">
                  {SPECIALIZATIONS.map((spec) => (
                    <label
                      key={spec}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={specFilter.includes(spec)}
                        onChange={() => toggleSpec(spec)}
                        className="h-3.5 w-3.5 rounded border"
                      />
                      {spec}
                    </label>
                  ))}
                  {specFilter.length > 0 && (
                    <button
                      onClick={() => setSpecFilter([])}
                      className="w-full border-t px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Sort: Newest</option>
            <option value="rating_desc">Sort: Top Rated</option>
            <option value="rating_asc">Sort: Lowest Rated</option>
            <option value="consultations">Sort: Most Consultations</option>
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
                  <TableHead>Bar #</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Consultations</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lawyers.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {l.user.avatar ? (
                          <img src={l.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                            {l.user.firstName[0]}{l.user.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{l.user.firstName} {l.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{l.user.email}</p>
                        </div>
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
                    <TableCell>
                      <span className="font-medium">{l._count.consultations}</span>
                      <span className="text-xs text-muted-foreground ml-1">sessions</span>
                    </TableCell>
                    <TableCell>{l.rating.toFixed(1)} ({l._count.reviews})</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${VERIFICATION_COLORS[l.verificationStatus] || ""}`}>
                        {l.verificationStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => setSelectedLawyer(l)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lawyers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No lawyers found
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

      {/* ── Lawyer Detail Modal ── */}
      <Dialog open={!!selectedLawyer} onOpenChange={(open) => !open && setSelectedLawyer(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedLawyer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {selectedLawyer.user.avatar ? (
                    <img src={selectedLawyer.user.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {selectedLawyer.user.firstName[0]}{selectedLawyer.user.lastName[0]}
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-lg">
                      {selectedLawyer.user.firstName} {selectedLawyer.user.lastName}
                    </DialogTitle>
                    <DialogDescription asChild>
                      <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${VERIFICATION_COLORS[selectedLawyer.verificationStatus] || ""}`}>
                        {selectedLawyer.verificationStatus}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{selectedLawyer.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedLawyer.user.phone ? (
                        <span>{formatPhone(selectedLawyer.user.phone)}</span>
                      ) : (
                        <span className="text-muted-foreground">No phone</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* License Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">License Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Bar # <span className="font-mono font-medium">{selectedLawyer.barNumber}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{selectedLawyer.licenseState}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      <span>Rating: <span className="font-medium">{selectedLawyer.rating.toFixed(1)}</span> ({selectedLawyer._count.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Consultations: <span className="font-medium">{selectedLawyer._count.consultations}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Joined: <span className="font-medium">{new Date(selectedLawyer.user.createdAt).toLocaleDateString()}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${selectedLawyer.isAvailable ? "bg-green-500" : "bg-gray-400"}`} />
                      <span>{selectedLawyer.isAvailable ? "Available" : "Unavailable"}</span>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Specializations</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLawyer.specializations.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {selectedLawyer.specializations.length === 0 && (
                      <span className="text-xs text-muted-foreground">None listed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Documents</h4>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="mb-1.5 text-xs font-medium">Bar License</p>
                    {selectedLawyer.licenseImage ? (
                      <button
                        onClick={() => setLightboxImage(selectedLawyer.licenseImage)}
                        className="group overflow-hidden rounded-lg border-2 border-transparent transition hover:border-indigo-400"
                      >
                        <img src={selectedLawyer.licenseImage} alt="License" className="h-24 w-36 object-cover transition group-hover:scale-105" />
                      </button>
                    ) : (
                      <div className="flex h-24 w-36 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                        <FileText className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="mb-1.5 text-xs font-medium">Government ID</p>
                    {selectedLawyer.idImage ? (
                      <button
                        onClick={() => setLightboxImage(selectedLawyer.idImage)}
                        className="group overflow-hidden rounded-lg border-2 border-transparent transition hover:border-indigo-400"
                      >
                        <img src={selectedLawyer.idImage} alt="ID" className="h-24 w-36 object-cover transition group-hover:scale-105" />
                      </button>
                    ) : (
                      <div className="flex h-24 w-36 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                        <IdCard className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                {selectedLawyer.verificationStatus !== "VERIFIED" && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVerify(selectedLawyer.id, "VERIFIED")}>
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Verify
                  </Button>
                )}
                {selectedLawyer.verificationStatus !== "REJECTED" && (
                  <Button size="sm" variant="destructive" onClick={() => handleVerify(selectedLawyer.id, "REJECTED")}>
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Image Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Document"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
