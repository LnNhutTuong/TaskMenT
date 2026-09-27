-- DropForeignKey
ALTER TABLE "AssignedTask" DROP CONSTRAINT "AssignedTask_assignId_fkey";

-- DropForeignKey
ALTER TABLE "AssignedTask" DROP CONSTRAINT "AssignedTask_taskId_fkey";

-- AddForeignKey
ALTER TABLE "AssignedTask" ADD CONSTRAINT "AssignedTask_assignId_fkey" FOREIGN KEY ("assignId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedTask" ADD CONSTRAINT "AssignedTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
