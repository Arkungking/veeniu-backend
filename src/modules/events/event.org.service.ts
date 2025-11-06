import { Category, Location, Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { generateSlug } from "../../utils/generate-slug";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDTO } from "./dto/create-event.dto";
import { EditEventDTO } from "./dto/edit-event.dto";

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
      ...(search && {
        title: { contains: search, mode: Prisma.QueryMode.insensitive },
      }),
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
      message: "Organizer events fetched successfully",
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

  createEvent = async (
    data: CreateEventDTO,
    thumbnail: Express.Multer.File
  ) => {
    if (!thumbnail) throw new ApiError("image is required", 400);

    const { url } = await this.cloudinaryService.upload(thumbnail);
    const slug = generateSlug(data.title);


    const newEvent = await this.prisma.event.create({
      data: {
        ...data,
        imageUrl: url,
        slug,
      },
    });

    return {
      message: "Event created successfully",
      data: newEvent,
    };
  };

  editEvent = async (
    id: string,
    data: Partial<EditEventDTO>,
    thumbnail?: Express.Multer.File
  ) => {
    const event = await this.prisma.event.findFirst({ where: { id } });
    if (!event) throw new ApiError("event not found", 404);

    let imageUrl = event.imageUrl;

    if (thumbnail) {
      await this.cloudinaryService.remove(event.imageUrl);
      const { url } = await this.cloudinaryService.upload(thumbnail);
      imageUrl = url;
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...data,
        imageUrl,
      },
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

    await this.cloudinaryService.remove(event.imageUrl);

    await this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        imageUrl: "",
      },
    });

    return {
      message: "Event deleted successfully",
    };
  };
}
