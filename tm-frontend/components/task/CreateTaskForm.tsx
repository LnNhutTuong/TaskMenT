"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "react-toastify";
import { useState } from "react";
import {
  PriorityLevel,
  CreateTaskFormData,
  CreateTaskPayload,
} from "../../app/types/task";
import z from "zod";
import { createTask } from "@/service/task.service";

type CreateTaskFormProps = {
  handleGetAllTasks: () => Promise<unknown>;
};

export const CreateTaskForm = ({ handleGetAllTasks }: CreateTaskFormProps) => {
  const openPicker = (input: HTMLInputElement) => {
    if ("showPicker" in input && typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<PriorityLevel>("MEDIUM");

  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const [deadlineTime, setDeadlineTime] = useState<string>("");

  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDeadlineDate("");
    setDeadlineTime("");

    setOpen(false);
  };

  const createTaskSchema = z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
      deadlineDate: z.string().optional(),
      deadlineTime: z.string().optional(),
    })
    .refine(
      (data) => {
        const hasDate = !!data.deadlineDate;
        const hasTime = !!data.deadlineTime;
        return hasDate === hasTime;
      },
      {
        message: "Date and time must be selected together",
        path: ["deadLineTime"],
      },
    );

  const handleSubmit = async () => {
    const result = createTaskSchema.safeParse({
      title,
      description,
      priority,
      deadlineDate,
      deadlineTime,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    const dataTask: CreateTaskFormData = { ...result.data };
    const deadline =
      dataTask.deadlineTime && dataTask.deadlineDate
        ? `${deadlineDate}T${deadlineTime}`
        : undefined;

    const payload: CreateTaskPayload = {
      title: dataTask.title,
      description: dataTask.description,
      priority: dataTask.priority,
      deadline,
    };

    await createTask(payload);
    await handleGetAllTasks();

    toast.success("Create task successfully");
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="mb-3 flex items-center gap-2">
            <Badge className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em]">
              Task
            </Badge>
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">
              New item
            </span>
          </div>
          <DialogTitle>Create a new task</DialogTitle>
          <DialogDescription>
            Add the details needed to keep this task moving through the board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="task-title"
              className="text-sm font-lg text-white/75 font-bold"
            >
              Title
            </label>
            <Input
              id="task-title"
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              placeholder="e.g. Implement user onboarding flow"
              className="h-12 rounded-xl border-white/[0.08] bg-black/70 px-4 text-base"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="task-description"
              className="text-sm font-lg text-white/75 font-bold"
            >
              Description
            </label>
            <textarea
              id="task-description"
              name="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="Describe the expected outcome..."
              className="min-h-28 w-full resize-y rounded-xl border border-white/[0.08] bg-black/70 px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/35 focus:ring-2 focus:ring-white/10"
            />
          </div>

          <div>
            <div className="space-y-2">
              <label
                htmlFor="task-priority"
                className="text-sm font-lg text-white/75 font-bold"
              >
                Priority
              </label>
              <Select
                id="task-priority"
                name="priority"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as PriorityLevel);
                }}
                className="h-12 w-full rounded-xl border-white/[0.08] bg-black/70 px-4 text-md"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-lg font-bold text-white/75">Deadline</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="task-deadline-date"
                  className="text-xs font-medium text-white/55"
                >
                  Date
                </label>
                <Input
                  id="task-deadline-date"
                  name="deadlineDate"
                  type="date"
                  onClick={(event) => openPicker(event.currentTarget)}
                  value={deadlineDate}
                  onChange={(e) => {
                    setDeadlineDate(e.target.value);
                  }}
                  className="h-12 cursor-pointer rounded-xl border-white/[0.08] bg-black/70 px-4 text-sm text-white/75"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="task-deadline-time"
                  className="text-xs font-medium text-white/55"
                >
                  Time
                </label>
                <Input
                  id="task-deadline-time"
                  name="deadlineTime"
                  value={deadlineTime}
                  onChange={(e) => {
                    setDeadlineTime(e.target.value);
                  }}
                  type="time"
                  onClick={(event) => openPicker(event.currentTarget)}
                  className="h-12 cursor-pointer rounded-xl border-white/[0.08] bg-black/70 px-4 text-sm text-white/75"
                />
              </div>
            </div>
            <p className="text-xs text-white/40">
              Optional. Choose a date and time for this task.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] pt-6 ">
            <DialogClose asChild>
              <Button variant="ghost" className="text-md">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              className="text-md"
            >
              Create task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
