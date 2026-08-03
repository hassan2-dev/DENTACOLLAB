import { Global, Injectable, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    userId?: string | null;
    userName: string;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        userName: input.userName,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        details: input.details || null,
      },
    });
  }

  list(params: { q?: string; limit?: number } = {}) {
    const q = params.q?.trim();
    return this.prisma.auditLog.findMany({
      where: q
        ? {
            OR: [
              { userName: { contains: q, mode: 'insensitive' } },
              { action: { contains: q, mode: 'insensitive' } },
              { entity: { contains: q, mode: 'insensitive' } },
              { details: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 100,
    });
  }
}

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
