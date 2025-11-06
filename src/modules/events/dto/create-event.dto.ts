import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
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
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  totalSeats!: number;

  @IsNotEmpty()
  @IsString()
  organizerId!: string;
}
