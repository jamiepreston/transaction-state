import { IsString, IsNumber, IsEnum } from 'class-validator';
import { status } from '../constants';
import type { Status } from '../interfaces/transaction.interface';

export class CreateTransactionDto {
  @IsString()
  TransactionId: string;

  @IsString()
  FromAddress: string;

  @IsString()
  ToAddress: string;

  @IsString()
  TokenName: string;

  @IsNumber()
  Amount: number;

  @IsEnum(status)
  Status: Status;
}
