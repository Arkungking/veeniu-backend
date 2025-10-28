import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  IsEnum,
} from "class-validator";
import { Category, Location } from "../../../generated/prisma";

export class CreateEventDTO {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsEnum(Category)
  category!: Category;

  @IsNotEmpty()
  @IsEnum(Location)
  location!: Location;

  @IsNotEmpty()
  @IsDateString()
  startDate!: Date;

  @IsNotEmpty()
  @IsDateString()
  endDate!: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  price!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  totalSeats!: number;

  @IsNotEmpty()
  @IsString()
  organizerId!: string;
}
