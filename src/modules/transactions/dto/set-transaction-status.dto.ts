import { TransactionStatus } from "@prisma/client";
import { IsEnum, isNotEmpty, IsNotEmpty, IsUUID } from "class-validator";

export class SetTransactionStatusDTO {
  @IsNotEmpty()
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;
}
