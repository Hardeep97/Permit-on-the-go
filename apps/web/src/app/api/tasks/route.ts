import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: {
      assigneeId: string;
      status?: string;
      priority?: string;
    } = { assigneeId: user.id };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const now = new Date();

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          permit: {
            select: {
              id: true,
              title: true,
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
          checklistItems: {
            orderBy: { sortOrder: "asc" },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          // Overdue tasks first (dueDate < now and status != COMPLETED)
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.task.count({ where }),
    ]);

    // Sort to put overdue tasks first
    const sortedTasks = tasks.sort((a, b) => {
      const aOverdue =
        a.dueDate && a.dueDate < now && a.status !== "COMPLETED";
      const bOverdue =
        b.dueDate && b.dueDate < now && b.status !== "COMPLETED";

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // If both overdue or both not overdue, sort by dueDate
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }

      // If one has dueDate and other doesn't, prioritize the one with dueDate
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // Finally, sort by createdAt
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return success({
      tasks: sortedTasks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("List my tasks error:", error);
    return serverError();
  }
}
