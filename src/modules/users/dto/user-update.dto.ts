import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserUpdateDTO {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
