import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewDTO } from "./dto/create-review.dto";

export class ReviewService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  getReviews = async (organizerId?: string, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const where = organizerId ? { organizerId } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        skip,
        take: limit,
        where,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      message: "Reviews fetched successfully",
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  };

  createReview = async (data: CreateReviewDTO) => {
    const event = await this.prisma.event.findFirst({
      where: { id: data.eventId },
    });
    const user = await this.prisma.user.findFirst({
      where: { id: data.userId },
    });

    if (!event) throw new ApiError("event not found", 404);
    if (!user) throw new ApiError("user not found", 404);

    const review = await this.prisma.review.create({ data });

    return { message: "Review created successfully", data: review };
  };
}
