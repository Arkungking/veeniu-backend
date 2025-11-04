import { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTicketDTO } from "./dto/create-ticket.dto";

export class TicketService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  getTickets = async (page = 1, limit = 10, search?: string) => {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      ...(search && {
        name: { contains: search, mode: Prisma.QueryMode.insensitive },
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        where,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      message: "Tickets fetched successfully",
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

  getOrgTickets = async (
    organizerId: string,
    page = 1,
    limit = 10,
    search?: string
  ) => {
    const skip = (page - 1) * limit;
    const where = {
      organizerId,
      deletedAt: null,
      ...(search && {
        title: { contains: search, mode: Prisma.QueryMode.insensitive },
      }),
    };
    const include = {
      event: {
        select: {
          title: true,
        },
      },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        where,
        include,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      message: "Organizer tickets fetched successfully",
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

  getTicket = async (id: string) => {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id },
    });

    if (!ticket) throw new ApiError("ticket not found", 404);

    return {
      message: "Ticket fetched successfully",
      data: ticket,
    };
  };

  createTicket = async (data: CreateTicketDTO) => {
    const event = await this.prisma.event.findFirst({
      where: { id: data.eventId },
    });

    if (!event) throw new ApiError("event not found", 404);

    const ticket = await this.prisma.ticket.create({
      data,
    });

    return {
      message: "Ticket created successfully",
      data: ticket,
    };
  };

  deleteTicket = async (id: string) => {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id },
    });
    if (!ticket) throw new ApiError("ticket not found", 404);
    await this.prisma.ticket.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: "Ticket deleted successfully",
    };
  };
}
