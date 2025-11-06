import { Prisma, TransactionStatus } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { TransactionQueue } from "./transaction.queue";

export class TransactionService {
  private prisma: PrismaService;
  private mailService: MailService;
  private transactionQueue: TransactionQueue;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.prisma = new PrismaService();
    this.mailService = new MailService();
    this.transactionQueue = new TransactionQueue();
    this.cloudinaryService = new CloudinaryService();
  }

  getUserTransactions = async (
    userId: string,
    authUserId: string,
    page = 1,
    limit = 10,
    search?: string
  ) => {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new ApiError("User not found", 404);
    if (authUserId !== userId)
      throw new ApiError(
        "You are not authorized to view this user's transactions",
        403
      );

    const skip = (page - 1) * limit;

    const transactions = await this.prisma.transaction.findMany({
      skip,
      take: limit,
      where: {
        userId,
        ...(search && {
          event: {
            title: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
        }),
      },
      include: {
        event: true,
        transactionDetails: {
          include: {
            ticket: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await this.prisma.transaction.count({ where: { userId } });

    return {
      message: "User transactions fetched successfully",
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  createTransaction = async (
    body: CreateTransactionDTO,
    authUserId: string
  ) => {
    // 1. get all ticket IDs from body.payload
    const payload = body.payload; // [{ ticketId: 1, qty: 1 },{ ticketId: 2, qty: 2 }]
    const ticketIds = payload.map((item) => item.ticketId); // [1,2]

    // 2. fetch all tickets from DB based on ticket IDs
    const tickets = await this.prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
      include: { event: true },
    });

    // 3. validate tickets availability
    for (const item of payload) {
      const ticket = tickets.find((ticket) => ticket.id === item.ticketId);

      if (!ticket) {
        throw new ApiError(`ticket with id ${item.ticketId} not found`, 400);
      }

      if (ticket.stock < item.qty) {
        throw new ApiError("insufficient stock", 400);
      }
    }
    // make sure all ticket belong to the same event
    const eventId = tickets[0].eventId;
    const allSameEvent = tickets.every((t) => t.eventId === eventId);
    if (!allSameEvent)
      throw new ApiError("All tickets must belong to the same event", 400);

    // sum total & ticket expiration
    const totalAmount = payload.reduce((sum, item) => {
      const ticket = tickets.find((t) => t.id === item.ticketId)!;
      return sum + ticket.price * item.qty;
    }, 0);

    // apply voucher and points
    let discountAmount = 0;
    // 1. voucher
    if (body.voucherId) {
      const voucher = await this.prisma.voucher.findUnique({ where: { id: body.voucherId }});
      if (!voucher) throw new ApiError("invalid voucher", 400);
      if (voucher.eventId !== eventId) throw new ApiError("voucher not valid for this event", 400);
      if (voucher.expiresAt < new Date()) throw new ApiError("voucher expired", 400);
      discountAmount += voucher.value;
    }
    // 2. points
    if (body.usePoints && body.usePoints > 0) {
      const userPointsSum = await this.prisma.reward.aggregate({
        where: { userId: authUserId, point: { gt: 0 } },
        _sum: { point: true }
      });
      const available = userPointsSum._sum.point ?? 0;
      if (body.usePoints > available) throw new ApiError("not enough points", 400);
      discountAmount += body.usePoints; // 1 point = 1 IDR
    }

    const finalAmount = totalAmount - discountAmount;

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); //2 hour expr

    const result = await this.prisma.$transaction(async (tx) => {
      // 4. create data transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: authUserId,
          eventId,
          totalAmount,
          discountAmount,
          finalAmount,
          expiresAt,
        },
      });

      // 5. create data transaction detail
      const transactionDetails = payload.map((item) => {
        const ticket = tickets.find((ticket) => ticket.id === item.ticketId)!;

        return {
          transactionId: transaction.id,
          ticketId: ticket.id,
          qty: item.qty,
          price: ticket.price,
        };
      });

      await tx.transactionDetail.createMany({
        data: transactionDetails,
      });


      // 6. decrement stock for each ticket
      for (const item of payload) {
        await tx.ticket.update({
          where: { id: item.ticketId },
          data: { stock: { decrement: item.qty } },
        });
      }

      // if voucher used: mark voucher as used or create a relation.
      if (body.voucherId) {
        // simple: create a relation via Transaction.usedVoucherId
        const voucher = await tx.voucher.findUnique({ where: { code: body.voucherId }});
        if (voucher) {
          await tx.transaction.update({ where: { id: transaction.id }, data: { usedVoucherId: voucher.id }});
        }
      }

      // if points used: create a Reward record to mark usage (negative point)
      if (body.usePoints && body.usePoints > 0) {
        await tx.reward.create({
          data: {
            userId: authUserId,
            point: -Math.abs(body.usePoints),
            triggeredById: authUserId,
            createdAt: new Date()
          }
        });
        // alternatively decrement aggregated pointBalance
      }

      return transaction;
    });

    // 7. TODO: send email untuk upload bukti bayar
    const user = await this.prisma.user.findFirst({
      where: { id: authUserId },
      select: { name: true, email: true },
    });

    const event = tickets[0].event;

    await this.mailService.sendEmail(
      user!.email,
      `Complete your payment for ${event.title}`,
      "upload-payment",
      {
        name: user!.name,
        eventTitle: event.title,
        uploadUrl: `https://veeniu.com/transaction/${result.uuid}/upload-proof`,
        year: new Date().getFullYear(),
      }
    );
    // 8. buat delay queue
    await this.transactionQueue.addNewTransaction(result.uuid);

    return { message: "create transaction success" };
  };

  uploadPaymentProof = async (
    uuid: string,
    paymentProof: Express.Multer.File,
    authUserId: string
  ) => {
    // cari dulu transaksi berdasarkan uuid
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid },
    });

    // kalo ga ada throw error
    if (!transaction) {
      throw new ApiError("invalid transaction uuid", 400);
    }

    // kalo ada cek juga userId di data transaksi sama tidak dengan authUserId dari isi token
    // kalo tidak sama throw error
    if (transaction.userId !== authUserId) {
      throw new ApiError("Forbidden", 403);
    }

    // hanya status transaksi tertentu yang bisa upload payment proof
    const allowedStatus: TransactionStatus[] = [
      "WAITING_FOR_PAYMENT",
      "WAITING_FOR_CONFIRMATION",
    ];
    if (!allowedStatus.includes(transaction.status)) {
      throw new ApiError("Invalid transaction status", 400);
    }

    // kalo udah ada paymentProof sebelumnya, dihapus dulu.
    if (transaction.paymentProof) {
      await this.cloudinaryService.remove(transaction.paymentProof);
    }

    // upload paymentProof ke cloudinary
    const { secure_url } = await this.cloudinaryService.upload(paymentProof);

    // update data status transaksi menjadi WAITING_FOR_CONFIRMATION & isi kolom payment
    // proof dengan secure_url dari cloudinary
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "WAITING_FOR_CONFIRMATION", paymentProof: secure_url },
    });

    return { message: "upload payment proof success" };
  };

  acceptTransaction = async (uuid: string, organizerId: string) => {
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid },
      include: { event: true, transactionDetails: true },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.event.organizerId !== organizerId)
      throw new ApiError("Forbidden", 403);

    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError("Invalid transaction status", 400);
    }

    await this.prisma.$transaction(async tx => {
      await tx.transaction.update({ where: { id: transaction.id }, data: { status: "DONE", confirmedAt: new Date() }});
      // create or update attendee
      const existing = await tx.eventAttendee.findFirst({ where: { eventId: transaction.eventId, userId: transaction.userId }});
      const ticketCount = transaction.transactionDetails.reduce((s, d) => s + d.qty, 0);
      if (existing) {
        await tx.eventAttendee.update({ where: { id: existing.id }, data: { ticketCount: { increment: ticketCount }, totalPaid: { increment: transaction.finalAmount } }});
      } else {
        await tx.eventAttendee.create({ data: { eventId: transaction.eventId, userId: transaction.userId, ticketCount, totalPaid: transaction.finalAmount }});
      }
    });

    return { message: "transaction accepted" };
  };

  rejectTransaction = async (uuid: string, organizerId: string) => {
    // 1. Find transaction and include details
    const transaction = await this.prisma.transaction.findUnique({
      where: { uuid },
      include: {
        event: true,
        transactionDetails: true,
      },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.event.organizerId !== organizerId)
      throw new ApiError("Forbidden", 403);

    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError("Invalid transaction status", 400);
    }

    // 2. Run in atomic transaction
    await this.prisma.$transaction(async (tx) => {
      // update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "REJECTED",
          canceledAt: new Date(),
        },
      });

      // restore stock for all tickets in the transaction
      for (const detail of transaction.transactionDetails) {
        await tx.ticket.update({
          where: { id: detail.ticketId },
          data: { stock: { increment: detail.qty } },
        });
      }

      // rollback used points: create reward with positive points (optional)
      if (transaction.usedPoints && transaction.usedPoints > 0) {
        await tx.reward.create({ data: { userId: transaction.userId, point: transaction.usedPoints, triggeredById: transaction.userId }});
      }
      // rollback voucher: if you reserved voucher mark as unused (depending how you implement)
      if (transaction.paymentProof) {
        await this.cloudinaryService.remove(transaction.paymentProof);
        await tx.transaction.update({
    where: { id: transaction.id },
    data: { paymentProof: null },
  });
      }
    });

    return { message: "transaction rejected and stock restored" };
  };
}
