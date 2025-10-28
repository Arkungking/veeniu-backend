import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateReviewDTO {
  @IsNotEmpty()
  @IsNumber()
  rating!: number;

  @IsNotEmpty()
  @IsString()
  commentEvent!: string;

  @IsNotEmpty()
  @IsString()
  commentOrganizer!: string;

  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsNotEmpty()
  @IsString()
  userId!: string;
}
