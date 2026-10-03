import { prisma } from "@/lib/prisma";

let subtaskTableEnsured = false;

export async function ensureSubtaskTable() {
  if (subtaskTableEnsured) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Subtask" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "taskId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "isCompleted" BOOLEAN NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP(3),
        "completedById" TEXT,
        "createdById" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Foreign Key to Task
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Subtask" 
        ADD CONSTRAINT "Subtask_taskId_fkey" 
        FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {}

    // Indexes
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Subtask_taskId_idx" ON "Subtask"("taskId");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Subtask_isCompleted_idx" ON "Subtask"("isCompleted");`); } catch {}

    // Ensure isMonthly and monthlyRecurringDay columns on Task
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "isMonthly" BOOLEAN NOT NULL DEFAULT false;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "monthlyRecurringDay" INTEGER;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Task_isMonthly_idx" ON "Task"("isMonthly");`);
    } catch {}

    // Ensure TaskAssignee table for multiple employee assignments
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TaskAssignee" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "taskId" TEXT NOT NULL,
          "employeeId" TEXT NOT NULL,
          "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "TaskAssignee" 
        ADD CONSTRAINT "TaskAssignee_taskId_fkey" 
        FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "TaskAssignee" 
        ADD CONSTRAINT "TaskAssignee_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {}

    try { await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "TaskAssignee_taskId_employeeId_key" ON "TaskAssignee"("taskId", "employeeId");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TaskAssignee_taskId_idx" ON "TaskAssignee"("taskId");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TaskAssignee_employeeId_idx" ON "TaskAssignee"("employeeId");`); } catch {}

    // Backfill single assignedToId into TaskAssignee
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "TaskAssignee" ("id", "taskId", "employeeId", "assignedAt")
        SELECT 'mig_' || "id" || '_' || "assignedToId", "id", "assignedToId", "createdAt"
        FROM "Task"
        WHERE "assignedToId" IS NOT NULL
        ON CONFLICT ("taskId", "employeeId") DO NOTHING;
      `);
    } catch {}

    subtaskTableEnsured = true;
  } catch (err) {
    console.error("ensureSubtaskTable warning:", err);
  }
}
