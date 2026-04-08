import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Post,
} from '@nestjs/common';
import { TransactionService } from './transactions.service';
import type { Transaction } from './interfaces/transaction.interface';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionHistory } from './interfaces/transaction-history.interface';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(): Transaction[] {
    return this.transactionService.findAll();
  }

  @Get(':id')
  findOne(@Param() params: { id: string }): {
    transaction: Transaction;
    history: TransactionHistory[];
  } {
    const { transaction, history } = this.transactionService.findOne(params.id);
    return { transaction, history };
  }

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    this.transactionService.put(createTransactionDto);
  }

  @Post('bulk')
  createBulk(
    @Body(new ParseArrayPipe({ items: CreateTransactionDto }))
    createTransactionDtos: CreateTransactionDto[],
  ) {
    createTransactionDtos.forEach(
      (createTransactionDto: CreateTransactionDto) =>
        this.transactionService.put(createTransactionDto),
    );
  }
}
