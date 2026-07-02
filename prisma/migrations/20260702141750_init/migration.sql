-- CreateTable
CREATE TABLE "Closer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "closerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "number" TEXT,
    "dateBooked" DATETIME,
    "appointmentDate" DATETIME NOT NULL,
    "requestedTime" TEXT,
    "setterOrigin" TEXT NOT NULL,
    "showed" TEXT NOT NULL,
    "result" TEXT,
    "rescheduleDate" DATETIME,
    "cashCollected" REAL NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "objection" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_closerId_fkey" FOREIGN KEY ("closerId") REFERENCES "Closer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Closer_name_key" ON "Closer"("name");

-- CreateIndex
CREATE INDEX "Appointment_closerId_idx" ON "Appointment"("closerId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_setterOrigin_idx" ON "Appointment"("setterOrigin");
