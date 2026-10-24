/*
  Warnings:

  - The values [APPROVED,REJECTED] on the enum `EvaluationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reviewerComment` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerScore` on the `EvaluationCriteriaResult` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `ProjectMember` table without a default value. This is not possible if the table is not empty.
  - Made the column `key` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `workspaceId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Workflow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EvaluationStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWING', 'COMPLETED');
ALTER TABLE "public"."Evaluation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Evaluation" ALTER COLUMN "status" TYPE "EvaluationStatus_new" USING ("status"::text::"EvaluationStatus_new");
ALTER TYPE "EvaluationStatus" RENAME TO "EvaluationStatus_old";
ALTER TYPE "EvaluationStatus_new" RENAME TO "EvaluationStatus";
DROP TYPE "public"."EvaluationStatus_old";
ALTER TABLE "Evaluation" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
ALTER TYPE "RoleScope" ADD VALUE 'PROJECT';

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_reviewerId_fkey";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "reviewerComment",
DROP COLUMN "reviewerId";

-- AlterTable
ALTER TABLE "EvaluationCriteriaResult" DROP COLUMN "reviewerScore";

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "roleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "key" SET NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "workspaceId" TEXT NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "workspaceId" TEXT NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EvaluationReviewer" (
    "evaluationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "comment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationReviewer_pkey" PRIMARY KEY ("evaluationId","reviewerId")
);

-- CreateTable
CREATE TABLE "EvaluationReviewerScore" (
    "evaluationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "evaluationCriteriaId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comment" TEXT,

    CONSTRAINT "EvaluationReviewerScore_pkey" PRIMARY KEY ("evaluationId","reviewerId","evaluationCriteriaId")
);

-- CreateIndex
CREATE INDEX "Task_workspaceId_projectId_idx" ON "Task"("workspaceId", "projectId");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationReviewer" ADD CONSTRAINT "EvaluationReviewer_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationReviewer" ADD CONSTRAINT "EvaluationReviewer_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationReviewerScore" ADD CONSTRAINT "EvaluationReviewerScore_evaluationId_reviewerId_fkey" FOREIGN KEY ("evaluationId", "reviewerId") REFERENCES "EvaluationReviewer"("evaluationId", "reviewerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationReviewerScore" ADD CONSTRAINT "EvaluationReviewerScore_evaluationCriteriaId_fkey" FOREIGN KEY ("evaluationCriteriaId") REFERENCES "EvaluationCriteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
