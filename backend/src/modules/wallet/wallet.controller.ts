import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AddBalanceDto } from './dto/add-balance.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':ownerId')
  getWallet(@Param('ownerId') ownerId: string) {
    return this.walletService.getWallet(ownerId);
  }

  @Post(':ownerId/add')
  addBalance(@Param('ownerId') ownerId: string, @Body() dto: AddBalanceDto) {
    return this.walletService.addBalance(ownerId, dto);
  }

  @Post(':ownerId/withdraw')
  withdraw(@Param('ownerId') ownerId: string, @Body() dto: WithdrawDto) {
    return this.walletService.withdraw(ownerId, dto);
  }
}
