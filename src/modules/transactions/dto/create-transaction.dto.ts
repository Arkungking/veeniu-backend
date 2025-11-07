import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class TransactionItemDTO {
  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateTransactionDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDTO)
  payload!: TransactionItemDTO[];

  @IsOptional()
  @IsString()
  voucherId?: string;

  @IsOptional()
  @IsNumber()
  usePoints?: number;

  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
