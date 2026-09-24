import { prisma } from "@/lib/prisma";

let tablesEnsured = false;

export async function ensureCompanyTables() {
  if (tablesEnsured) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Software" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "code" TEXT,
        "category" TEXT,
        "description" TEXT,
        "defaultPrice" DOUBLE PRECISION,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3)
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Company" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "companyName" TEXT NOT NULL,
        "companyNameBangla" TEXT,
        "contactPerson" TEXT,
        "designation" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "district" TEXT,
        "subDistrict" TEXT,
        "website" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3)
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CompanySubscription" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "softwareId" TEXT NOT NULL,
        "billingCycle" TEXT NOT NULL DEFAULT 'Yearly',
        "price" DOUBLE PRECISION,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "startDate" TIMESTAMP(3),
        "expireDate" TIMESTAMP(3),
        "actualExpireDate" TIMESTAMP(3),
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3)
      );
    `);

    // Foreign Keys
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CompanySubscription" 
        ADD CONSTRAINT "CompanySubscription_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CompanySubscription" 
        ADD CONSTRAINT "CompanySubscription_softwareId_fkey" 
        FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {}

    // Indexes
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Software_deletedAt_idx" ON "Software"("deletedAt");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Software_status_idx" ON "Software"("status");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Company_deletedAt_idx" ON "Company"("deletedAt");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Company_district_idx" ON "Company"("district");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanySubscription_companyId_idx" ON "CompanySubscription"("companyId");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanySubscription_softwareId_idx" ON "CompanySubscription"("softwareId");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanySubscription_expireDate_idx" ON "CompanySubscription"("expireDate");`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanySubscription_deletedAt_idx" ON "CompanySubscription"("deletedAt");`); } catch {}

    tablesEnsured = true;
  } catch (err) {
    console.error("ensureCompanyTables warning:", err);
  }
}
