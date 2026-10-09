import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

const USER_RESTORE_DAYS = 30;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    // private readonly storage: StorageService, // service xóa file cloud của bạn
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'Asia/Ho_Chi_Minh' })
  @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: 'Asia/Ho_Chi_Minh' })
  async cleanupDeletedData() {
    
    console.log('\n===========Starting cleanup...===========');

    // 1. Lấy URL file cloud TRƯỚC khi xóa dòng DB (cascade sẽ xóa Evidence)
    const fileUrls = await this.collectEvidenceUrls();

    // 2. Xóa bảng con trước, bảng cha sau; một bước lỗi không chặn các bước còn lại
    const deleted = { deletedAt: { not: null } };
    const steps: [string, () => Promise<{ count: number }>][] = [
      ['evaluations', () => this.prisma.evaluation.deleteMany({ where: deleted })],
      ['objectives',  () => this.prisma.objective.deleteMany({ where: deleted })],
      ['tasks',       () => this.prisma.task.deleteMany({ where: deleted })],
      ['projects',    () => this.prisma.project.deleteMany({ where: deleted })],
      ['workspaces',  () => this.prisma.workspace.deleteMany({ where: deleted })],
    ];

    for (const [name, run] of steps) {
      try {
        const { count } = await run();
        this.logger.log(`Deleted ${count} ${name}`);
      } catch (err) {
        this.logger.error(`Cleanup ${name} failed`, err instanceof Error ? err.stack : String(err));
      }
    }

    // 3. Xóa file trên cloud (best-effort)
    await this.deleteCloudFiles(fileUrls);

    // 4. User: giữ 30 ngày để khôi phục
    try {
      await this.cleanupUsers();
    } catch (err) {
      this.logger.error('Cleanup users failed', err instanceof Error ? err.stack : String(err));
    }

    console.log('===========Cleanup completed===========');
  }

  private async collectEvidenceUrls(): Promise<string[]> {
    const evidences = await this.prisma.evidence.findMany({
      where: {
        taskOutput: {
          task: {
            OR: [
              { deletedAt: { not: null } },
              { parentTask: { deletedAt: { not: null } } }, // subtask cấp 1
              { project: { deletedAt: { not: null } } },
              { project: { workspace: { deletedAt: { not: null } } } },
            ],
          },
        },
      },
      select: { fileUrl: true },
    });
    return evidences.map((e) => e.fileUrl);
  }

  private async deleteCloudFiles(urls: string[]) {
    for (const url of urls) {
      try {
        // await this.storage.delete(url);
      } catch (err) {
        this.logger.warn(`Failed to delete cloud file ${url}`);
      }
    }
    this.logger.log(`Processed ${urls.length} cloud files`);
  }

  private async cleanupUsers() {
    const expired = new Date(Date.now() - USER_RESTORE_DAYS * 86_400_000);
    const users = await this.prisma.user.findMany({
      where: { deletedAt: { lte: expired } },
      select: { id: true },
    });

    let deleted = 0;
    for (const { id } of users) {
      try {
        await this.prisma.user.delete({ where: { id } });
        deleted++;
      } catch (err) {
        // P2003: user còn được tham chiếu (createdBy, owner...) -> giữ lại
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') continue;
        throw err;
      }
    }
    this.logger.log(`Deleted ${deleted}/${users.length} users`);
  }
}