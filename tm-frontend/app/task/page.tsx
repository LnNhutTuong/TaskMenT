"use client";

import { apiFetch } from "@/lib/api";
import type {
  PriorityLevel,
  TaskItem,
  TaskList,
  TaskStatus,
} from "../types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RefreshCw, Search, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function TaskPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | "ALL">("ALL");
  const [taskPriority, setTaskPriority] = useState<PriorityLevel | "ALL">(
    "ALL",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const statusOrder: (TaskStatus | "ALL")[] = [
    "ALL",
    "TODO",
    "IN_PROGRESS",
    "DONE",
  ];

  const fetchAllTasks = () =>
    apiFetch<TaskList>(
      "http://localhost:2202/task/all?page=1&limit=10&sortBy=createdAt&sortOrder=desc",
    );

  const getAllTask = async (): Promise<TaskList | undefined> => {
    try {
      const respone = await fetchAllTasks();

      setErrorMessage("");
      setTasks(respone.data.tasks);
      return respone;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load tasks.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks()
      .then((respone) => {
        setTasks(respone.data.tasks);
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load tasks.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const visibleTasks = tasks.filter((task) => {
    const matchesStatus = taskStatus === "ALL" || task.status === taskStatus;
    const matchesPriority =
      taskPriority === "ALL" || task.priority === taskPriority;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      task.title.toLowerCase().includes(normalizedSearch) ||
      task.description?.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const statusLabel: Record<TaskStatus, string> = {
    TODO: "To do",
    IN_PROGRESS: "In progress",
    DONE: "Done",
  };

  const priorityLabel: Record<PriorityLevel, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  };

  return (
    <main className="min-h-screen bg-black font-sans text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-white/10 pb-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-[#080808] font-mono text-xs font-bold text-white transition hover:bg-white hover:text-black">
                &lt;/&gt;
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Developer Workspace
                </p>
                <h1 className="text-lg font-medium tracking-tight text-white">
                  DevTask Manager
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex p-3 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-[11px] text-white/70">
                XimenT
              </div>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "All tasks", value: tasks.length },
            {
              label: "In progress",
              value: tasks.filter((task) => task.status === "IN_PROGRESS")
                .length,
            },
            {
              label: "Completed",
              value: tasks.filter((task) => task.status === "DONE").length,
            },
          ].map((item) => (
            <Card key={item.label} className="px-4 py-3 shadow-none">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-medium tracking-tight text-white">
                {item.value}
              </p>
            </Card>
          ))}
        </section>

        <Card className="overflow-hidden shadow-[0_18px_48px_rgb(0_0_0_/_38%)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0a0a0a] px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                Backlog
              </p>
              <h2 className="mt-1 text-xl font-medium tracking-tight text-white">
                Task Board
              </h2>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Task
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-b border-white/10 bg-[#080808] px-5 py-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks..."
                className="pl-9"
                type="search"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOrder.map((status) => (
                <Button
                  key={status}
                  onClick={() => setTaskStatus(status)}
                  variant={taskStatus === status ? "default" : "outline"}
                  size="sm"
                  className={taskStatus === status ? "" : "text-white/60"}
                >
                  {status === "ALL" ? "All" : statusLabel[status]}
                </Button>
              ))}
              <Select
                value={taskPriority}
                onChange={(event) =>
                  setTaskPriority(event.target.value as PriorityLevel | "ALL")
                }
                aria-label="Filter by priority"
              >
                <option value="ALL">All priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
              <Button
                onClick={getAllTask}
                variant="outline"
                size="sm"
                aria-label="Refresh tasks"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {isLoading && (
              <p className="px-5 py-12 text-center text-sm text-white/45">
                Loading tasks...
              </p>
            )}

            {!isLoading && errorMessage && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-white/60">{errorMessage}</p>
                <Button
                  onClick={getAllTask}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            )}

            {!isLoading && !errorMessage && visibleTasks.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-white/45">
                No tasks match the current filters.
              </p>
            )}

            {!isLoading &&
              !errorMessage &&
              visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className="px-5 py-5 transition hover:bg-white/[0.025]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full border border-white/40 bg-white/70" />
                        <span className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                          {task.userId}
                        </span>
                      </div>
                      <h3 className="text-base font-medium tracking-tight text-white/90">
                        {task.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge>{statusLabel[task.status]}</Badge>
                        <Badge>{priorityLabel[task.priority]}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl leading-6">{task.description}</p>
                    <span className="text-[16px] text-white/95">
                      Deadline:{" "}
                      {task.deadline
                        ? formatDate(task.deadline)
                        : "No deadline"}{" "}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
