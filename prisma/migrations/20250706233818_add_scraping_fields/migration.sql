-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCallOutcome" TEXT,
    "lastCallDate" DATETIME,
    "assignedTo" TEXT,
    "status" TEXT DEFAULT 'Open',
    "profileLink" TEXT,
    "volume" TEXT,
    "region" TEXT,
    CONSTRAINT "Contact_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "outcome" TEXT NOT NULL,
    "isDeal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Call_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Call_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "contactId" TEXT,
    "callId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PendingCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "initiatedAt" DATETIME NOT NULL,
    "scheduledFor" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "openPhoneCallId" TEXT,
    "notificationShown" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PendingCall_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PendingCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "cellPhone" TEXT,
    "assignedCallNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME,
    "dailyCallGoal" INTEGER DEFAULT 30,
    "dailyDealGoal" INTEGER DEFAULT 5,
    "dailyContactGoal" INTEGER DEFAULT 10,
    "openPhoneApiKey" TEXT,
    "scrapingSettings" TEXT,
    "scrapingUsage" TEXT
);

-- CreateIndex
CREATE INDEX "Contact_assignedTo_idx" ON "Contact"("assignedTo");

-- CreateIndex
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateIndex
CREATE INDEX "Contact_lastCallOutcome_idx" ON "Contact"("lastCallOutcome");

-- CreateIndex
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Call_contactId_idx" ON "Call"("contactId");

-- CreateIndex
CREATE INDEX "Call_userId_idx" ON "Call"("userId");

-- CreateIndex
CREATE INDEX "Call_isDeal_idx" ON "Call"("isDeal");

-- CreateIndex
CREATE INDEX "Call_date_idx" ON "Call"("date");

-- CreateIndex
CREATE INDEX "Call_outcome_idx" ON "Call"("outcome");

-- CreateIndex
CREATE INDEX "Call_contactId_date_idx" ON "Call"("contactId", "date");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_contactId_idx" ON "Task"("contactId");

-- CreateIndex
CREATE INDEX "Task_completed_idx" ON "Task"("completed");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");

-- CreateIndex
CREATE INDEX "PendingCall_userId_idx" ON "PendingCall"("userId");

-- CreateIndex
CREATE INDEX "PendingCall_contactId_idx" ON "PendingCall"("contactId");

-- CreateIndex
CREATE INDEX "PendingCall_status_idx" ON "PendingCall"("status");

-- CreateIndex
CREATE INDEX "PendingCall_phoneNumber_idx" ON "PendingCall"("phoneNumber");

-- CreateIndex
CREATE INDEX "PendingCall_initiatedAt_idx" ON "PendingCall"("initiatedAt");

-- CreateIndex
CREATE INDEX "PendingCall_scheduledFor_idx" ON "PendingCall"("scheduledFor");

-- CreateIndex
CREATE INDEX "PendingCall_priority_idx" ON "PendingCall"("priority");

-- CreateIndex
CREATE INDEX "PendingCall_userId_status_idx" ON "PendingCall"("userId", "status");

-- CreateIndex
CREATE INDEX "PendingCall_phoneNumber_initiatedAt_idx" ON "PendingCall"("phoneNumber", "initiatedAt");

-- CreateIndex
CREATE INDEX "PendingCall_openPhoneCallId_idx" ON "PendingCall"("openPhoneCallId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
