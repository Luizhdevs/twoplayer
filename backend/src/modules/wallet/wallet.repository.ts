import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOwner(ownerId: string) {
    return this.prisma.wallet.findFirst({
      where: { ownerId, deletedAt: null },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.wallet.findFirst({
      where: { id, deletedAt: null },
    });
  }

  create(ownerId: string) {
    return this.prisma.wallet.create({ data: { ownerId } });
  }

  async credit(
    walletId: string,
    amount: number,
    description: string,
    referenceId?: string,
  ) {
    return this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.CREDIT,
          amount,
          description,
          referenceId,
          status: 'COMPLETED',
        },
      }),
    ]);
  }

  async debit(
    walletId: string,
    amount: number,
    description: string,
    referenceId?: string,
  ) {
    return this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.DEBIT,
          amount,
          description,
          referenceId,
          status: 'COMPLETED',
        },
      }),
    ]);
  }

  async withdraw(walletId: string, amount: number, pixKey: string) {
    return this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.WITHDRAWAL,
          amount,
          description: `Resgate via Pix: ${pixKey}`,
          status: 'COMPLETED',
        },
      }),
    ]);
  }

  getTransactions(walletId: string) {
    return this.prisma.walletTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
