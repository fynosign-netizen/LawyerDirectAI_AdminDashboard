import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api, type AdminTodo, type Pagination } from "@/lib/api";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function TodosPage() {
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Add form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  const fetchTodos = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (statusFilter) params.set("completed", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);

    api
      .get<{ data: AdminTodo[]; pagination: Pagination }>(`/admin/todos?${params}`)
      .then((res) => {
        setTodos(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTodos();
  }, [statusFilter, priorityFilter]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    try {
      await api.post("/admin/todos", {
        title: title.trim(),
        description: description.trim() || null,
        date: date || null,
        priority,
      });
      setTitle("");
      setDescription("");
      setDate("");
      setPriority("medium");
      fetchTodos();
    } catch {}
    setAdding(false);
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await api.put(`/admin/todos/${id}`, { completed: !completed });
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/todos/${id}`);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  const startEdit = (todo: AdminTodo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditDate(todo.date ? todo.date.split("T")[0] : "");
    setEditPriority(todo.priority);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    try {
      await api.put(`/admin/todos/${editingId}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        date: editDate || null,
        priority: editPriority,
      });
      setEditingId(null);
      fetchTodos();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
        <p className="text-sm text-muted-foreground">Manage your admin tasks</p>
      </div>

      {/* Add Todo Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1 block text-xs font-medium">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button onClick={handleAdd} disabled={adding || !title.trim()}>
              {adding ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Add Todo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {[
          { value: "" as const, label: "All" },
          { value: "false" as const, label: "Active" },
          { value: "true" as const, label: "Completed" },
        ].map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? "default" : "outline"}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Todo List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : todos.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No todos found
            </div>
          ) : (
            <div className="divide-y">
              {todos.map((todo) => (
                <div key={todo.id} className={`flex items-center gap-3 px-4 py-3 ${todo.completed ? "opacity-60" : ""}`}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo.id, todo.completed)}
                    className="h-4 w-4 rounded"
                  />

                  {editingId === todo.id ? (
                    <>
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8 max-w-xs"
                        />
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                          className="h-8 max-w-xs"
                        />
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="h-8 rounded-md border bg-background px-2 text-xs"
                        />
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                          className="h-8 rounded-md border bg-background px-2 text-xs"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={saveEdit}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${todo.completed ? "line-through" : ""}`}>
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className="truncate text-xs text-muted-foreground">{todo.description}</p>
                        )}
                      </div>
                      {todo.date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(todo.date).toLocaleDateString()}
                        </span>
                      )}
                      <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[todo.priority] || ""}`}>
                        {todo.priority}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => startEdit(todo)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => handleDelete(todo.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === pagination.page ? "default" : "outline"} onClick={() => fetchTodos(p)}>
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
