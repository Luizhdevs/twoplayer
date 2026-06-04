import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WalletRepository } from './wallet.repository';
import { AddBalanceDto } from './dto/add-balance.dto';
import { WithdrawDto } from './dto/withdraw.dto';

const WITHDRAWAL_FEE = 0.15;

@Injectable()
export class WalletService {
  constructor(private readonly repo: WalletRepository) {}

  async getWallet(ownerId: string) {
    const wallet = await this.repo.findByOwner(ownerId);
    if (!wallet) throw new NotFoundException('Carteira não encontrada');

    const totalCredit = wallet.transactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((a, t) => a + t.amount, 0);

    const totalDebit = wallet.transactions
      .filter((t) => t.type === 'DEBIT' || t.type === 'WITHDRAWAL')
      .reduce((a, t) => a + t.amount, 0);

    return {
      id: wallet.id,
      balance: wallet.balance / 100,
      totalCredit: totalCredit / 100,
      totalDebit: totalDebit / 100,
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        type: t.type.toLowerCase(),
        amount: t.amount / 100,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
      })),
    };
  }

  async addBalance(ownerId: string, dto: AddBalanceDto) {
    const wallet = await this.repo.findByOwner(ownerId);
    if (!wallet) throw new NotFoundException('Carteira não encontrada');

    await this.repo.credit(
      wallet.id,
      dto.amount,
      dto.description ?? 'Recarga',
      dto.referenceId,
    );

    return { message: 'Saldo adicionado com sucesso', amount: dto.amount / 100 };
  }

  async withdraw(ownerId: string, dto: WithdrawDto) {
    const wallet = await this.repo.findByOwner(ownerId);
    if (!wallet) throw new NotFoundException('Carteira não encontrada');

    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Saldo insuficiente');
    }

    const fee = Math.round(dto.amount * WITHDRAWAL_FEE);
    const net = dto.amount - fee;

    await this.repo.withdraw(wallet.id, dto.amount, dto.pixKey);

    return {
      message: 'Resgate solicitado com sucesso',
      requested: dto.amount / 100,
      fee: fee / 100,
      net: net / 100,
      pixKey: dto.pixKey,
    };
  }

  async debitForAppointment(
    ownerId: string,
    amount: number,
    description: string,
    referenceId: string,
  ) {
    const wallet = await this.repo.findByOwner(ownerId);
    if (!wallet) throw new NotFoundException('Carteira não encontrada');
    if (wallet.balance < amount) throw new BadRequestException('Saldo insuficiente');
    return this.repo.debit(wallet.id, amount, description, referenceId);
  }
}
