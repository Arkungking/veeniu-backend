import { TransactionStatus } from "../../generated/prisma";
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

    const discountAmount = 0; // later handle voucher/points
    const finalAmount = totalAmount - discountAmount;

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); //15 mnt expr

    const result = await this.prisma.$transaction(async (tx) => {
      // 4. create data transaction
      const transaction = await tx.transaction.create({
        data: { userId: authUserId, eventId,
          totalAmount,
          discountAmount,
          finalAmount,
          expiresAt, },
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
      },
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
      include: { event: true },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.event.organizerId !== organizerId)
      throw new ApiError("Forbidden", 403);

    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError("Invalid transaction status", 400);
    }

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "DONE",
        confirmedAt: new Date(),
      },
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

    });

    return { message: "transaction rejected and stock restored" };
  };
}
