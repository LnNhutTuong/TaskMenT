-- CreateEnum
CREATE TYPE "OutputType" AS ENUM ('DOCUMENT', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "formulaId" TEXT;

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyResult" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "KeyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskKeyResult" (
    "taskId" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,

    CONSTRAINT "TaskKeyResult_pkey" PRIMARY KEY ("taskId","keyResultId")
);

-- CreateTable
CREATE TABLE "TaskOutput" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "expectedType" "OutputType" NOT NULL DEFAULT 'DOCUMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "TaskOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskOutputId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Formula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskMetricValue" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TaskMetricValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPISnapshot" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "expression" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "metricValues" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPISnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "kpiWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "criteriaWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriteria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "periodId" TEXT NOT NULL,

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "kpiScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criteriaScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "classification" TEXT,
    "selfComment" TEXT,
    "reviewerComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriteriaResult" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "evaluationCriteriaId" TEXT NOT NULL,
    "selfScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewerScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comment" TEXT,

    CONSTRAINT "EvaluationCriteriaResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationRule" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Metric_workspaceId_key_key" ON "Metric"("workspaceId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "TaskMetricValue_taskId_metricId_key" ON "TaskMetricValue"("taskId", "metricId");

-- CreateIndex
CREATE UNIQUE INDEX "KPISnapshot_taskId_key" ON "KPISnapshot"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_periodId_userId_key" ON "Evaluation"("periodId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriteriaResult_evaluationId_evaluationCriteriaId_key" ON "EvaluationCriteriaResult"("evaluationId", "evaluationCriteriaId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "Formula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResult" ADD CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskKeyResult" ADD CONSTRAINT "TaskKeyResult_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskKeyResult" ADD CONSTRAINT "TaskKeyResult_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOutput" ADD CONSTRAINT "TaskOutput_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_taskOutputId_fkey" FOREIGN KEY ("taskOutputId") REFERENCES "TaskOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formula" ADD CONSTRAINT "Formula_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMetricValue" ADD CONSTRAINT "TaskMetricValue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMetricValue" ADD CONSTRAINT "TaskMetricValue_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPISnapshot" ADD CONSTRAINT "KPISnapshot_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationPeriod" ADD CONSTRAINT "EvaluationPeriod_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteria" ADD CONSTRAINT "EvaluationCriteria_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "EvaluationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "EvaluationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteriaResult" ADD CONSTRAINT "EvaluationCriteriaResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteriaResult" ADD CONSTRAINT "EvaluationCriteriaResult_evaluationCriteriaId_fkey" FOREIGN KEY ("evaluationCriteriaId") REFERENCES "EvaluationCriteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationRule" ADD CONSTRAINT "ClassificationRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
