"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PriorityLevel, TaskItem, TaskStatus } from "@/app/types/task";

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

const statusStyles: Record<TaskStatus, string> = {
  TODO: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  IN_PROGRESS: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  DONE: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
};

type TaskWithIdProps = {
  task: TaskItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaskWithId({ task, open, onOpenChange }: TaskWithIdProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:p-8">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-2">
            <Badge className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em]">
              Task
            </Badge>
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">
              View item
            </span>
          </div>
          <DialogTitle className="text-[22px] font-normal tracking-tight text-white">
            {task.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-white/45">
            Review the full task details before continuing to the next step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/75">Title</label>
            <div className="flex min-h-12 w-full items-center rounded-xl border border-white/[0.08] bg-black/70 px-4 text-base text-white">
              {task.title}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/75">
              Description
            </label>
            <div className="min-h-28 w-full rounded-xl border border-white/[0.08] bg-black/70 px-4 py-3 text-base text-white/80">
              {task.description || "No description provided for this task."}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/75">
                Priority
              </label>
              <div className="flex min-h-12 items-center rounded-xl border border-white/[0.08] bg-black/70 px-4">
                <Badge
                  className={`px-2.5 py-1 text-xs ${priorityStyles[task.priority]}`}
                >
                  {priorityLabel[task.priority]}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/75">Status</label>
              <div className="flex min-h-12 items-center rounded-xl border border-white/[0.08] bg-black/70 px-4">
                <Badge
                  className={`px-2.5 py-1 text-xs ${statusStyles[task.status]}`}
                >
                  {statusLabel[task.status]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-white/75">Deadline</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/55">
                  Date
                </label>
                <div className="flex h-12 items-center rounded-xl border border-white/[0.08] bg-black/70 px-4 text-sm text-white/75">
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString("en-CA")
                    : "Not set"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/55">
                  Time
                </label>
                <div className="flex h-12 items-center rounded-xl border border-white/[0.08] bg-black/70 px-4 text-sm text-white/75">
                  {task.deadline
                    ? new Date(task.deadline).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not set"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/75">Assignee</label>
            <div className="flex min-h-12 items-center rounded-xl border border-white/[0.08] bg-black/70 px-4 text-base text-white/80">
              {task.userId}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.08] bg-black/70 px-3 py-2 text-xs text-white/50">
              Created:{" "}
              {new Date(task.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/70 px-3 py-2 text-xs text-white/50">
              Updated:{" "}
              {new Date(task.updatedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-2 border-t border-white/[0.08] pt-6">
          <DialogClose asChild>
            <Button variant="ghost" className="text-md text-white/75">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-md"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
