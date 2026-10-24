import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

const RESTORE_RETENTION_DAYS = 7;

const RETENTION_MS = RESTORE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    // private readonly storage: StorageService, // service xóa file cloud của bạn
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'Asia/Ho_Chi_Minh' })
  async cleanupDeletedData() {

    console.log('\n===========Starting cleanup...===========');

    // 1. Lấy URL file cloud TRƯỚC khi xóa dòng DB (cascade sẽ xóa Evidence)
    // const fileUrls = await this.collectEvidenceUrls();

    // 2. Xóa bảng con trước, bảng cha sau; một bước lỗi không chặn các bước còn lại
    const expiredBefore = new Date(Date.now() - RETENTION_MS);
    const expired = {
      deletedAt: {
        lte: expiredBefore,
      },
    };

    const steps: [string, () => Promise<{ count: number } >][] = [
      
      ['objectives', () =>
        this.prisma.objective.deleteMany({
          where: {
            ...expired,

            // Không xóa Objective khi KeyResult còn liên kết với Task
            keyResults: {
              none: {
                taskLinks: {
                  some: {},
                },
              },
            },
          },
        })],
      
      ['tasks', () =>
      this.prisma.task.deleteMany({
        where: {
          ...expired,

          subTasks: {
            none: {},
          },

          // Không xóa Task nếu có Evidence đã được chấp nhận
          taskOutputs: {
            every: {
              evidences: {
                none: {
                  status: 'ACCEPTED',
                },
              },
            },
          },
        },
      })],

      
      ['projects', () =>
        this.prisma.project.deleteMany({
          where: {
            ...expired,

            // Chỉ xóa Project khi không còn Task nào
            tasks: {
              none: {},
            },

            // Chỉ xóa Project khi không còn Objective nào
            objectives: {
              none: {},
            },
          },
        })],


      ['workspaces', () =>
        this.prisma.workspace.deleteMany({
          where: {
            ...expired,

            projects: {
              none: {},
            },

            objectives: {
              none: {},
            },

            evaluationPeriods: {
              none: {
                evaluations: {
                  some: {
                    status: { in: ['SUBMITTED', 'REVIEWING', 'COMPLETED'] },
                  },
                },
              },
            },
          },
        })],

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
    // await this.deleteCloudFiles(fileUrls);

    // 4. User: giữ 7 ngày để khôi phục
    try {
      await this.cleanupUsers(expiredBefore);
    } catch (err) {
      this.logger.error('Cleanup users failed', err instanceof Error ? err.stack : String(err));
    }

    console.log('===========Cleanup completed===========');
  }

  private async collectEvidenceUrls(): Promise<string[]> {
    const expiredBefore = new Date(Date.now() - RETENTION_MS);
    const evidences = await this.prisma.evidence.findMany({
      where: {
        taskOutput: {
          task: {
            OR: [
              { deletedAt: { lte: expiredBefore } },
              { parentTask: { deletedAt: { lte: expiredBefore } } }, // subtask cấp 1
              { project: { deletedAt: { lte: expiredBefore } } },
              { project: { workspace: { deletedAt: { lte: expiredBefore } } } },
            ],
          },
        },
      },
      select: { fileUrl: true },
    });
    return evidences.map((e) => e.fileUrl);
  }

  // private async deleteCloudFiles(urls: string[]) {
  //   for (const url of urls) {
  //     try {
  //       // await this.storage.delete(url);
  //     } catch (err) {
  //       this.logger.warn(`Failed to delete cloud file ${url}`);
  //     }
  //   }
  //   this.logger.log(`Processed ${urls.length} cloud files`);
  // }

  private async cleanupUsers(expiredBefore: Date) {
  const users = await this.prisma.user.findMany({
    where: {
      deletedAt: { lte: expiredBefore },

      ownedWorkspaces: {
        none: {},
      },
      createdProjects: {
        none: {},
      },
      createdTasks: {
        none: {},
      },

      reviewedEvidence: {
        none: { status: 'ACCEPTED' },
      },

      
      evaluationReviews: {
        none: {},      
      },

      // Không chọn User đã upload Evidence ACCEPTED
      submittedEvidence: {
        none: { status: 'ACCEPTED' },
      },

      // Không chọn User còn Evaluation đã nộp/được duyệt
      userEvaluation: {
        none: {
          status: {
            in: ['SUBMITTED', 'REVIEWING', 'COMPLETED'],
          },
        },
      },
    },
    select: { id: true },
  });

  let deleted = 0;
  let skipped = 0;
  let failed = 0;

  for (const { id } of users) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      deleted++;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        skipped++;

        this.logger.warn(
          `Skipped user ${id}: still referenced by other records`,
        );

        continue;
      }

      failed++;

      this.logger.error(
        `Failed to delete user ${id}`,
        err instanceof Error ? err.stack : String(err),
      );

      // Không throw ở đây.
      // Tiếp tục xử lý user tiếp theo.
    }
  }

  this.logger.log(
    `User cleanup completed: total=${users.length}, ` +
    `deleted=${deleted}, skipped=${skipped}, failed=${failed}`,
  );
  }

}