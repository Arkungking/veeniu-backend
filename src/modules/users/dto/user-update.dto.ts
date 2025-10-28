import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserUpdateDTO {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  profilePicture?: string;
}
