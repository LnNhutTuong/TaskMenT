import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });

    super({ adapter });
  }

  //ham tu chay khi module nay duoc khoi tao
  async onModuleInit() {
    await this.$connect();
    console.log('===========11 Database connected 11===========');
  }

  //ham tu chay khi app ngung hoat dong
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('===========11 Database disconnected 11===========');
  }
}
