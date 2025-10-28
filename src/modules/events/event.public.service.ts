import { Category, Location } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";

export class EventService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  getEvents = async (
    page = 1,
    limit = 10,
    search?: string,
    category?: Category,
    location?: Location
  ) => {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(category && { category: category }),
      ...(location && { location: location }),
    };
    const include = {
      organizer: {
        select: {
          id: true,
          name: true,
          profilePicture: true,
        },
      },
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      vouchers: {
        select: {
          id: true,
          code: true,
          discountPct: true,
        },
      },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        skip,
        take: limit,
        where,
        include,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      message: "Events fetched successfully",
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

  getEvent = async (id: string) => {
    const event = await this.prisma.event.findFirst({
      where: { id },
    });

    if (!event) {
      throw new ApiError("event not found", 404);
    }

    return {
      message: "Event fetched successfully",
      data: event,
    };
  };
}
