import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class TransactionItemDTO {
  @IsString()
  @Min(1)
  ticketId!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateTransactionDTO {
  @IsArray()
  @Type(() => TransactionItemDTO)
  @ValidateNested({ each: true })
  payload!: TransactionItemDTO[];

  @IsOptional()
  @IsString()
  voucherId?: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
