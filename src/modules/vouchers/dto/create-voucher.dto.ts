import { Type } from "class-transformer";
import { IsDate, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateVoucherDTO {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  value!: number;

  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  expiresAt!: Date;

  @IsNotEmpty()
  @IsString()
  organizerId!: string;
}
