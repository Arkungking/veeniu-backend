import { Category, Location } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDTO } from "./dto/create-event.dto";

export class OrgEventService {
  private prisma: PrismaService;
  private cloudinaryService: CloudinaryService;
  constructor() {
    this.prisma = new PrismaService();
    this.cloudinaryService = new CloudinaryService();
  }

  getOrgEvents = async (
    organizerId: string,
    page = 1,
    limit = 10,
    search?: string,
    category?: Category,
    location?: Location
  ) => {
    const skip = (page - 1) * limit;
    const where = {
      organizerId,
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

  createEvent = async (data: CreateEventDTO, image: Express.Multer.File) => {
    if (!image) throw new ApiError("image is required", 400);

    const { secureUrl } = await this.cloudinaryService.upload(image);

    const newEvent = await this.prisma.event.create({
      data: {
        ...data,
        imageUrl: secureUrl,
      },
    });

    return {
      message: "Event created successfully",
      data: newEvent,
    };
  };

  editEvent = async (id: string, data: Partial<CreateEventDTO>) => {
    const event = await this.prisma.event.findFirst({
      where: { id },
    });
    if (!event) throw new ApiError("event not found", 404);

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data,
    });

    return {
      message: "Event updated successfully",
      data: updatedEvent,
    };
  };

  deleteEvent = async (id: string) => {
    const event = await this.prisma.event.findFirst({
      where: { id },
    });
    if (!event) throw new ApiError("event not found", 404);
    await this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: "Event deleted successfully",
    };
  };
}
