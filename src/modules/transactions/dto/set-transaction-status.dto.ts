import { IsEnum, isNotEmpty, IsNotEmpty, IsUUID } from "class-validator";
import { TransactionStatus } from "../../../generated/prisma";

export class SetTransactionStatusDTO {
  @IsNotEmpty()
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;
}
