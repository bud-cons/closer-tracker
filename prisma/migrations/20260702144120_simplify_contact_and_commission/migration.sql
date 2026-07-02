/*
  Warnings:

  - You are about to drop the column `email` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `revenue` on the `Appointment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "closerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateBooked" DATETIME,
    "appointmentDate" DATETIME NOT NULL,
    "requestedTime" TEXT,
    "setterOrigin" TEXT NOT NULL,
    "showed" TEXT NOT NULL,
    "result" TEXT,
    "rescheduleDate" DATETIME,
    "cashCollected" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "objection" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_closerId_fkey" FOREIGN KEY ("closerId") REFERENCES "Closer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("appointmentDate", "cashCollected", "closerId", "createdAt", "dateBooked", "id", "name", "objection", "requestedTime", "rescheduleDate", "result", "setterOrigin", "showed", "updatedAt") SELECT "appointmentDate", "cashCollected", "closerId", "createdAt", "dateBooked", "id", "name", "objection", "requestedTime", "rescheduleDate", "result", "setterOrigin", "showed", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE INDEX "Appointment_closerId_idx" ON "Appointment"("closerId");
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");
CREATE INDEX "Appointment_setterOrigin_idx" ON "Appointment"("setterOrigin");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
