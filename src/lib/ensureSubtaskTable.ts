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

    subtaskTableEnsured = true;
  } catch (err) {
    console.error("ensureSubtaskTable warning:", err);
  }
}
