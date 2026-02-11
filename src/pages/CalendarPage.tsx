import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Users, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, type CalendarData } from "@/lib/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add todo form
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchData = useCallback(() => {
    setLoading(true);
    api
      .get<{ data: CalendarData }>(`/admin/calendar?month=${monthStr}`)
      .then((res) => setCalendarData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedData = selectedDate ? calendarData[selectedDate] : null;

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim() || !selectedDate) return;
    setAddingTodo(true);
    try {
      await api.post("/admin/todos", { title: newTodoTitle.trim(), date: selectedDate, priority: "medium" });
      setNewTodoTitle("");
      fetchData();
    } catch {
      // silent
    } finally {
      setAddingTodo(false);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await api.put(`/admin/todos/${id}`, { completed: !completed });
      fetchData();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">View daily activity and manage todos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base">
                {MONTHS[month]} {year}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const dateStr = getDateStr(day);
                    const data = calendarData[dateStr];
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`relative flex min-h-[70px] flex-col rounded-md border p-1.5 text-left transition hover:bg-muted/50 ${
                          isSelected ? "border-primary bg-primary/5" : "border-transparent"
                        } ${isToday ? "ring-1 ring-primary/30" : ""}`}
                      >
                        <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>
                          {day}
                        </span>
                        {data && (
                          <div className="mt-auto flex flex-wrap gap-0.5">
                            {data.registrations > 0 && (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" title={`${data.registrations} registrations`} />
                            )}
                            {data.consultations > 0 && (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" title={`${data.consultations} consultations`} />
                            )}
                            {data.todos.length > 0 && (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" title={`${data.todos.length} todos`} />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Registrations
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Consultations
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> Todos
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <Users className="mx-auto mb-1 h-4 w-4 text-blue-500" />
                    <p className="text-lg font-semibold">{selectedData?.registrations || 0}</p>
                    <p className="text-xs text-muted-foreground">Registrations</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <MessageSquare className="mx-auto mb-1 h-4 w-4 text-green-500" />
                    <p className="text-lg font-semibold">{selectedData?.consultations || 0}</p>
                    <p className="text-xs text-muted-foreground">Consultations</p>
                  </div>
                </div>

                {/* Todos */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium">Todos</h4>
                    <Badge variant="secondary" className="text-xs">
                      {selectedData?.todos.length || 0}
                    </Badge>
                  </div>

                  {selectedData?.todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5 mb-1">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id, todo.completed)}
                        className="h-3.5 w-3.5 rounded"
                      />
                      <span className={`flex-1 text-sm ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                        {todo.title}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          todo.priority === "high" ? "bg-red-500" : todo.priority === "low" ? "bg-gray-400" : "bg-yellow-500"
                        }`}
                      />
                    </div>
                  ))}

                  {/* Add todo */}
                  <div className="mt-2 flex gap-1">
                    <input
                      type="text"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                      placeholder="Add a todo..."
                      className="h-8 flex-1 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button size="sm" className="h-8" onClick={handleAddTodo} disabled={addingTodo || !newTodoTitle.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Click on a date to see details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
