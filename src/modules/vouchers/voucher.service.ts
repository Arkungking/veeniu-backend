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
      this.prisma.event.findMany({
        skip,
        take: limit,
        where,
      }),
      this.prisma.event.count({ where }),
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
    const voucher = await this.prisma.voucher.create({
      data,
    });

    return {
      message: "Voucher created successfully",
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
