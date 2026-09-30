-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FikaType" AS ENUM ('COFFEE', 'FOOD', 'WALK', 'CONVERSATION', 'GAMING', 'STUDY', 'NETWORKING', 'CREATIVE', 'SPORTS', 'MUSIC');
CREATE TYPE "FikaStatus" AS ENUM ('OPEN', 'FULL', 'STARTING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ParticipantStatus" AS ENUM ('JOINED', 'LEFT', 'CANCELLED', 'ATTENDED');
CREATE TYPE "NotificationType" AS ENUM ('FIKA_JOINED', 'FIKA_LEFT', 'NEW_MESSAGE', 'FIKA_REMINDER', 'FIKA_CANCELLED', 'FIKA_INVITATION');

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "username" TEXT NOT NULL, "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL, "profileImage" TEXT, "bio" VARCHAR(500), "location" VARCHAR(120),
  "latitude" DECIMAL(9,6), "longitude" DECIMAL(9,6), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Interest" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserInterest" (
  "userId" TEXT NOT NULL, "interestId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userId", "interestId")
);
CREATE TABLE "UserActivityPreference" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "type" "FikaType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UserActivityPreference_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Fika" (
  "id" TEXT NOT NULL, "hostId" TEXT NOT NULL, "title" VARCHAR(140) NOT NULL, "description" VARCHAR(1200) NOT NULL,
  "type" "FikaType" NOT NULL, "date" DATE NOT NULL, "startTime" VARCHAR(5) NOT NULL, "duration" INTEGER NOT NULL,
  "locationName" VARCHAR(180) NOT NULL, "latitude" DECIMAL(9,6), "longitude" DECIMAL(9,6),
  "maxParticipants" INTEGER NOT NULL, "status" "FikaStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Fika_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FikaInterest" (
  "fikaId" TEXT NOT NULL, "interestId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FikaInterest_pkey" PRIMARY KEY ("fikaId", "interestId")
);
CREATE TABLE "FikaParticipant" (
  "id" TEXT NOT NULL, "fikaId" TEXT NOT NULL, "userId" TEXT NOT NULL, "status" "ParticipantStatus" NOT NULL DEFAULT 'JOINED',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FikaParticipant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Message" (
  "id" TEXT NOT NULL, "fikaId" TEXT NOT NULL, "senderId" TEXT NOT NULL, "content" VARCHAR(1000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConversationStarter" (
  "id" TEXT NOT NULL, "prompt" VARCHAR(500) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationStarter_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "type" "NotificationType" NOT NULL, "title" VARCHAR(160) NOT NULL,
  "message" VARCHAR(500) NOT NULL, "isRead" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Rating" (
  "id" TEXT NOT NULL, "fikaId" TEXT NOT NULL, "reviewerId" TEXT NOT NULL, "reviewedUserId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL, "feedback" VARCHAR(800), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Report" (
  "id" TEXT NOT NULL, "reporterId" TEXT NOT NULL, "reportedUserId" TEXT, "fikaId" TEXT, "reason" VARCHAR(120) NOT NULL,
  "description" VARCHAR(1000), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Block" (
  "id" TEXT NOT NULL, "blockerId" TEXT NOT NULL, "blockedUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_location_idx" ON "User"("location");
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");
CREATE INDEX "UserInterest_interestId_idx" ON "UserInterest"("interestId");
CREATE UNIQUE INDEX "UserActivityPreference_userId_type_key" ON "UserActivityPreference"("userId", "type");
CREATE INDEX "Fika_status_date_idx" ON "Fika"("status", "date");
CREATE INDEX "Fika_type_status_idx" ON "Fika"("type", "status");
CREATE INDEX "Fika_hostId_idx" ON "Fika"("hostId");
CREATE INDEX "FikaInterest_interestId_idx" ON "FikaInterest"("interestId");
CREATE INDEX "FikaParticipant_userId_status_idx" ON "FikaParticipant"("userId", "status");
CREATE UNIQUE INDEX "FikaParticipant_fikaId_userId_key" ON "FikaParticipant"("fikaId", "userId");
CREATE INDEX "Message_fikaId_createdAt_idx" ON "Message"("fikaId", "createdAt");
CREATE UNIQUE INDEX "ConversationStarter_prompt_key" ON "ConversationStarter"("prompt");
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
CREATE INDEX "Rating_reviewedUserId_idx" ON "Rating"("reviewedUserId");
CREATE UNIQUE INDEX "Rating_fikaId_reviewerId_reviewedUserId_key" ON "Rating"("fikaId", "reviewerId", "reviewedUserId");
CREATE INDEX "Report_fikaId_idx" ON "Report"("fikaId");
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");
CREATE INDEX "Block_blockedUserId_idx" ON "Block"("blockedUserId");
CREATE UNIQUE INDEX "Block_blockerId_blockedUserId_key" ON "Block"("blockerId", "blockedUserId");

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserActivityPreference" ADD CONSTRAINT "UserActivityPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fika" ADD CONSTRAINT "Fika_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FikaInterest" ADD CONSTRAINT "FikaInterest_fikaId_fkey" FOREIGN KEY ("fikaId") REFERENCES "Fika"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FikaInterest" ADD CONSTRAINT "FikaInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FikaParticipant" ADD CONSTRAINT "FikaParticipant_fikaId_fkey" FOREIGN KEY ("fikaId") REFERENCES "Fika"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FikaParticipant" ADD CONSTRAINT "FikaParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_fikaId_fkey" FOREIGN KEY ("fikaId") REFERENCES "Fika"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_fikaId_fkey" FOREIGN KEY ("fikaId") REFERENCES "Fika"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_reviewedUserId_fkey" FOREIGN KEY ("reviewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_fikaId_fkey" FOREIGN KEY ("fikaId") REFERENCES "Fika"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
