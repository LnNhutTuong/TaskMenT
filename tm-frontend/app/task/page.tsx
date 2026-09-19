"use client";

import type { PriorityLevel, TaskItem, TaskStatus } from "../types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CreateTaskForm } from "@/components/task/CreateTaskForm";
import {
  Check,
  CircleDot,
  Clock3,
  Ellipsis,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAllTasks, getTaskWithId } from "@/service/task.service";
import { TaskWithId } from "@/components/task/TaskWithId";

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
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const statusColumns: {
    status: TaskStatus;
    label: string;
    description: string;
    color: string;
    icon: typeof CircleDot;
  }[] = [
    {
      status: "TODO",
      label: "Todo",
      description: "This item hasn't been started",
      color: "text-sky-400",
      icon: CircleDot,
    },
    {
      status: "IN_PROGRESS",
      label: "In progress",
      description: "This is actively being worked on",
      color: "text-amber-400",
      icon: Clock3,
    },
    {
      status: "DONE",
      label: "Done",
      description: "This has been completed",
      color: "text-emerald-400",
      icon: Check,
    },
  ];

  const handleGetAllTasks = async () => {
    setIsLoading(true);
    try {
      const response = await getAllTasks();
      setErrorMessage("");
      setTasks(response.tasks);

      return response;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load tasks.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTaskWithId = async (taskId: string) => {
    try {
      const response = await getTaskWithId(taskId);
      console.log(">>>res: ", response);
      setErrorMessage("");
      setSelectedTask(response.data);
      setIsTaskDialogOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load tasks.",
      );
    }
  };

  console.log(">>>check task: ", selectedTask);

  useEffect(() => {
    getAllTasks()
      .then((response) => {
        setErrorMessage("");
        setTasks(response.tasks);
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load tasks.",
        );
      })
      .finally(() => setIsLoading(false));
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

  const priorityStyles: Record<PriorityLevel, string> = {
    LOW: "border-slate-500/35 bg-slate-500/10 text-slate-300",
    MEDIUM: "border-amber-400/35 bg-amber-400/10 text-amber-300",
    HIGH: "border-rose-400/35 bg-rose-400/10 text-rose-300",
  };

  const getTaskNumber = (id: string) => id.slice(-4).toUpperCase();

  return (
    <main className="relative min-h-screen bg-[#030303] px-3 py-4 font-sans text-[#f0f6fc] sm:px-5 lg:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%)]" />

      <div className="relative mx-auto max-w-[1580px]">
        <TaskWithId
          task={selectedTask}
          open={isTaskDialogOpen}
          onOpenChange={(open) => {
            setIsTaskDialogOpen(open);
            if (!open) {
              setSelectedTask(null);
            }
          }}
        />

        <header className="mb-4 rounded-2xl border border-white/[0.08] bg-[#080808]/80 px-4 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white text-[#0d1117]">
                <span className="font-mono text-xs font-bold">&lt;/&gt;</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                  XimenT <span className="px-1 text-white/20">/</span> Projects
                </p>
                <h1 className="mt-1 text-sm font-semibold text-[#f0f6fc]">
                  <span className="mr-1 text-[#8b949e]">▣</span> Super Task
                  Manager
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="outline"
                size="sm"
                className="border-white/[0.08] bg-[#111111] text-white/75 hover:bg-white/5"
              >
                <Filter className="h-3.5 w-3.5" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/[0.08] bg-[#111111] text-white/75 hover:bg-white/5"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <section className="mb-3 flex flex-col gap-3 border-b border-white/[0.08] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/[0.08] bg-[#111111] text-white"
            >
              <span className="text-base leading-none">▣</span>
              View 1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/55 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" /> New view
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>{tasks.length} items</span>
            <span className="text-white/20">•</span>
            <span>{visibleTasks.length} visible</span>
          </div>
        </section>

        <Card className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0a0a0a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#121212] px-4 py-3 sm:px-5">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                Project board
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#f0f6fc]">
                Super Task Manager
              </h2>
            </div>
            <CreateTaskForm handleGetAllTasks={handleGetAllTasks} />
          </div>

          <div className="flex flex-col gap-2 border-b border-white/[0.08] bg-[#0a0a0a] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Filter by keyword or by field"
                className="h-8 rounded-md border-white/[0.08] bg-[#010409] pl-9 text-xs text-[#f0f6fc] placeholder:text-white/25"
                type="search"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={taskStatus}
                onChange={(event) =>
                  setTaskStatus(event.target.value as TaskStatus | "ALL")
                }
                aria-label="Filter by status"
                className="h-8 border-white/[0.08] bg-[#161b22] text-xs text-white/70"
              >
                <option value="ALL">All statuses</option>
                <option value="TODO">{statusLabel.TODO}</option>
                <option value="IN_PROGRESS">{statusLabel.IN_PROGRESS}</option>
                <option value="DONE">{statusLabel.DONE}</option>
              </Select>
              <Select
                value={taskPriority}
                onChange={(event) =>
                  setTaskPriority(event.target.value as PriorityLevel | "ALL")
                }
                aria-label="Filter by priority"
                className="h-8 border-white/[0.08] bg-[#161b22] text-xs text-white/70"
              >
                <option value="ALL">All priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
              <Button
                onClick={handleGetAllTasks}
                variant="outline"
                size="sm"
                aria-label="Refresh tasks"
                className="h-8 border-white/[0.08] bg-[#161b22] text-white/70 hover:bg-white/5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="border-b border-white/[0.08] px-3 py-3 sm:px-4">
            {isLoading && (
              <p className="px-5 py-12 text-center text-sm text-[#8b949e]">
                Loading tasks...
              </p>
            )}

            {!isLoading && errorMessage && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-[#8b949e]">{errorMessage}</p>
                <Button
                  onClick={handleGetAllTasks}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            )}

            {!isLoading && !errorMessage && visibleTasks.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-[#8b949e]">
                No tasks match the current filters.
              </p>
            )}

            {!isLoading && !errorMessage && visibleTasks.length > 0 && (
              <div className="grid min-w-[900px] grid-cols-3 gap-2">
                {statusColumns.map((column) => {
                  const columnTasks = visibleTasks.filter(
                    (task) => task.status === column.status,
                  );
                  const StatusIcon = column.icon;

                  return (
                    <section
                      key={column.status}
                      className="flex min-h-[520px] flex-col rounded-xl border border-white/[0.08] bg-[#010409]"
                    >
                      <div className="border-b border-white/[0.08] px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${column.color}`} />
                            <h3 className="text-sm font-semibold text-[#f0f6fc]">
                              {column.label}
                            </h3>
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/60">
                              {columnTasks.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[#8b949e]">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Ellipsis className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-[#8b949e]">
                          {column.description}
                        </p>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-2">
                        {columnTasks.map((task) => (
                          <article
                            key={task.id}
                            onClick={() => {
                              handleGetTaskWithId(task.id);
                            }}
                            className="group cursor-pointer rounded-xl border border-white/[0.08] bg-[#0d1117] p-3 shadow-sm transition hover:border-white/20 hover:bg-[#161b22]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[11px] text-[#8b949e]">
                                #{getTaskNumber(task.id)}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="-mr-2 -mt-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                                aria-label={`More options for ${task.title}`}
                              >
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </div>
                            <h4 className="mt-1 text-sm font-medium leading-5 text-[#f0f6fc]">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#8b949e]">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <Badge
                                className={`px-2 py-0.5 text-[10px] ${priorityStyles[task.priority]}`}
                              >
                                {priorityLabel[task.priority]}
                              </Badge>
                              {task.deadline && (
                                <Badge className="gap-1 border-[#30363d] bg-transparent px-2 py-0.5 text-[10px] text-[#8b949e]">
                                  <Clock3 className="h-3 w-3" />
                                  {formatDate(task.deadline)}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-3 flex items-center gap-2 border-t border-[#21262d] pt-2 text-[10px] text-[#8b949e]">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 font-semibold text-[#f0f6fc]">
                                {task.userId.slice(0, 1).toUpperCase()}
                              </span>
                              <span className="truncate">{task.userId}</span>
                            </div>
                          </article>
                        ))}
                        {columnTasks.length === 0 && (
                          <div className="flex flex-1 items-center justify-center rounded border border-dashed border-white/[0.08] px-4 py-10 text-center text-xs text-white/25">
                            No items in this column
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
