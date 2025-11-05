import { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVoucherDTO } from "./dto/create-voucher.dto";

export class VoucherService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  getVouchers = async (page = 1, limit = 10, search?: string) => {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        skip,
        take: limit,
        where,
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      message: "Vouchers fetched successfully",
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

  getOrgVouchers = async (
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
      this.prisma.voucher.findMany({
        skip,
        take: limit,
        where,
        include,
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      message: "Vouchers fetched successfully",
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

  getVoucher = async (id: string) => {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id },
    });

    if (!voucher) throw new ApiError("voucher not found", 404);

    return {
      message: "Voucher fetched successfully",
      data: voucher,
    };
  };

  createVoucher = async (data: CreateVoucherDTO) => {
    const event = await this.prisma.event.findFirst({
      where: { id: data.eventId },
    });

    if (!event) throw new ApiError("event not found", 404);

    const voucher = await this.prisma.voucher.create({
      data,
    });

    return {
      message: "Organizer voucher created successfully",
      data: voucher,
    };
  };

  deleteVoucher = async (id: string) => {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id },
    });
    if (!voucher) throw new ApiError("voucher not found", 404);
    await this.prisma.voucher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: "Voucher deleted successfully",
    };
  };
}
