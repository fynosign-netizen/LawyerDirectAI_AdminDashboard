import { useEffect, useState } from "react";
import {
  Plus, Loader2, Trash2, Pencil, Eye, X, ChevronDown, ChevronUp,
  Briefcase, MapPin, Clock, Users, DollarSign, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type Pagination } from "@/lib/api";

interface CareerPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string;
  salaryMin: number | null;
  salaryMax: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: { applications: number };
}

interface CareerApplication {
  id: string;
  postingId: string;
  fullName: string;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
  coverLetter: string | null;
  linkedInUrl: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
};

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Marketing", "Sales",
  "Legal", "Operations", "Customer Support", "Finance", "Human Resources",
];

export default function CareerPostingsPage() {
  const [postings, setPostings] = useState<CareerPosting[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Create/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", department: "", location: "", employmentType: "FULL_TIME",
    description: "", requirements: "", salaryMin: "", salaryMax: "", status: "DRAFT",
  });

  // Applications view
  const [viewingPostingId, setViewingPostingId] = useState<string | null>(null);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      title: "", department: "", location: "", employmentType: "FULL_TIME",
      description: "", requirements: "", salaryMin: "", salaryMax: "", status: "DRAFT",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const fetchPostings = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (departmentFilter) params.set("department", departmentFilter);

    api
      .get<{ data: CareerPosting[]; pagination: Pagination }>(`/admin/careers?${params}`)
      .then((res) => {
        setPostings(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPostings();
  }, [statusFilter, departmentFilter]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.department.trim() || !form.location.trim() || !form.description.trim() || !form.requirements.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      };
      if (editingId) {
        await api.put(`/admin/careers/${editingId}`, body);
      } else {
        await api.post("/admin/careers", body);
      }
      resetForm();
      fetchPostings();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this career posting and all its applications?")) return;
    try {
      await api.delete(`/admin/careers/${id}`);
      setPostings((prev) => prev.filter((p) => p.id !== id));
      if (viewingPostingId === id) setViewingPostingId(null);
    } catch {}
  };

  const startEdit = (posting: CareerPosting) => {
    setForm({
      title: posting.title,
      department: posting.department,
      location: posting.location,
      employmentType: posting.employmentType,
      description: posting.description,
      requirements: posting.requirements,
      salaryMin: posting.salaryMin?.toString() || "",
      salaryMax: posting.salaryMax?.toString() || "",
      status: posting.status,
    });
    setEditingId(posting.id);
    setShowForm(true);
  };

  const viewApplications = async (postingId: string) => {
    if (viewingPostingId === postingId) {
      setViewingPostingId(null);
      return;
    }
    setViewingPostingId(postingId);
    setAppsLoading(true);
    try {
      const res = await api.get<{ data: CareerApplication[] }>(`/admin/careers/${postingId}/applications`);
      setApplications(res.data);
    } catch {
      setApplications([]);
    }
    setAppsLoading(false);
  };

  const deleteApplication = async (appId: string) => {
    try {
      await api.delete(`/admin/careers/applications/${appId}`);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch {}
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return "Not specified";
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Career Postings</h1>
          <p className="text-sm text-muted-foreground">Manage job postings for the careers page</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-1 h-4 w-4" /> New Posting
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{editingId ? "Edit Posting" : "Create New Posting"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div>
                <Label>Department *</Label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label>Location *</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. San Francisco, CA / Remote" />
              </div>
              <div>
                <Label>Employment Type</Label>
                <select
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>Salary Min (annual USD)</Label>
                <Input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="e.g. 80000" />
              </div>
              <div>
                <Label>Salary Max (annual USD)</Label>
                <Input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="e.g. 120000" />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and what the ideal candidate looks like..."
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>
            <div>
              <Label>Requirements *</Label>
              <textarea
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                placeholder="List required qualifications, skills, and experience (one per line)..."
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="flex items-end gap-2 ml-auto">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.department || !form.location.trim() || !form.description.trim() || !form.requirements.trim()}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {[
          { value: "", label: "All" },
          { value: "ACTIVE", label: "Active" },
          { value: "DRAFT", label: "Draft" },
          { value: "CLOSED", label: "Closed" },
        ].map((f) => (
          <Button key={f.value} size="sm" variant={statusFilter === f.value ? "default" : "outline"} onClick={() => setStatusFilter(f.value)}>
            {f.label}
          </Button>
        ))}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Postings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : postings.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No career postings found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postings.map((posting) => (
                  <>
                    <TableRow key={posting.id} className="cursor-pointer hover:bg-muted/30">
                      <TableCell className="font-medium max-w-[200px] truncate">{posting.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {posting.department}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{posting.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {TYPE_LABELS[posting.employmentType] || posting.employmentType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs">{formatSalary(posting.salaryMin, posting.salaryMax)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[posting.status] || ""}`}>
                          {posting.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => viewApplications(posting.id)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {posting._count.applications}
                          {viewingPostingId === posting.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(posting.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => startEdit(posting)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => handleDelete(posting.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Applications Row */}
                    {viewingPostingId === posting.id && (
                      <TableRow key={`${posting.id}-apps`}>
                        <TableCell colSpan={9} className="bg-muted/20 p-4">
                          {appsLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : applications.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">No applications yet</p>
                          ) : (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold">Applications ({applications.length})</h4>
                              <div className="space-y-2">
                                {applications.map((app) => (
                                  <Card key={app.id} className="shadow-sm">
                                    <CardContent className="p-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <p className="font-medium text-sm">{app.fullName}</p>
                                            <a href={`mailto:${app.email}`} className="text-xs text-primary hover:underline">{app.email}</a>
                                            {app.phone && <span className="text-xs text-muted-foreground">{app.phone}</span>}
                                            {app.linkedInUrl && (
                                              <a href={app.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                                                LinkedIn <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                            {app.resumeUrl && (
                                              <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                                                Resume <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Applied {new Date(app.createdAt).toLocaleDateString()} at {new Date(app.createdAt).toLocaleTimeString()}
                                          </p>
                                          {app.coverLetter && (
                                            <div className="mt-2">
                                              <button
                                                onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                                                className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                              >
                                                {expandedAppId === app.id ? "Hide" : "Show"} Cover Letter
                                                {expandedAppId === app.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                              </button>
                                              {expandedAppId === app.id && (
                                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap bg-background rounded p-2 border">
                                                  {app.coverLetter}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-7 text-red-600 shrink-0" onClick={() => deleteApplication(app.id)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === pagination.page ? "default" : "outline"} onClick={() => fetchPostings(p)}>
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
