import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  permitId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).optional(),
  completedAt: z.string().datetime().optional(),
});

export const createChecklistItemSchema = z.object({
  title: z.string().min(1, "Checklist item title is required").max(200),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isCompleted: z.boolean().optional(),
});

export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(200),
  description: z.string().max(2000).optional(),
  permitType: z.string().optional(),
  steps: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
      estimatedDays: z.number().int().positive().optional(),
      sortOrder: z.number().int().default(0),
    })
  ),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type CreateWorkflowTemplateInput = z.infer<typeof createWorkflowTemplateSchema>;
