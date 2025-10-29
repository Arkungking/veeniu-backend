import { Category, Location } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export class EventService {
  private prisma: PrismaService;
  private redisService: RedisService;

  constructor() {
    this.prisma = new PrismaService();
    this.redisService = new RedisService();
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
    const [data, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        skip,
        take: limit,
        where,
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

    const event = await this.prisma.event.findFirst({
      where: { id },
      include,
    });

    if (!event) {
      throw new ApiError("event not found", 404);
    }

    return {
      message: "Event fetched successfully",
      data: event,
    };
  };

  getLatestEvent = async () => {
    const latestEvent = await this.prisma.event.findMany({
      take: 8,
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!latestEvent) throw new ApiError("event not found", 404);

    return {
      message: "Latest event fetched successfully",
      data: latestEvent,
    };
  };

  getRandomEvent = async () => {
    const count = 12;
    const allEvents = await this.prisma.event.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    if (!allEvents) throw new ApiError("No events found", 404);

    const shuffled = allEvents.sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, count).map((e) => e.id);

    const randomEvents = await this.prisma.event.findMany({
      where: { id: { in: selectedIds } },
    });

    await this.redisService.setValue(
      "random_events",
      JSON.stringify(randomEvents),
      90
    );

    return {
      message: "Random events fetched successfully",
      data: randomEvents,
    };
  };
}
