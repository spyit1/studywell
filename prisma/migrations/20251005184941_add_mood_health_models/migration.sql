-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MoodLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MoodLog" ("at", "createdAt", "id", "mood", "note") SELECT "at", "createdAt", "id", "mood", "note" FROM "MoodLog";
DROP TABLE "MoodLog";
ALTER TABLE "new_MoodLog" RENAME TO "MoodLog";
CREATE INDEX "MoodLog_at_idx" ON "MoodLog"("at");
CREATE INDEX "MoodLog_createdAt_idx" ON "MoodLog"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DailyHealth_date_idx" ON "DailyHealth"("date");

-- CreateIndex
CREATE INDEX "DailyHealth_createdAt_idx" ON "DailyHealth"("createdAt");

-- CreateIndex
CREATE INDEX "Task_isDone_importance_dueDate_idx" ON "Task"("isDone", "importance", "dueDate");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");
