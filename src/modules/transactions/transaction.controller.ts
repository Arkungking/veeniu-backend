import { Request, Response } from "express";
import { TransactionService } from "./transaction.service";
import { ApiError } from "../../utils/api-error";

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  createTransaction = async (req: Request, res: Response) => {
    const body = req.body;
    const authUserId = String(res.locals.user.id);
    const result = await this.transactionService.createTransaction(
      body,
      authUserId
    );
    res.status(200).send(result);
  };

  uploadPaymentProof = async (req: Request, res: Response) => {
    const uuid = req.body.uuid;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const paymentProof = files.paymentProof?.[0];
    if (!paymentProof) throw new ApiError("paymentProod is required", 400);
    const authUserId = res.locals.user.id;

    const result = await this.transactionService.uploadPaymentProof(
      uuid,
      paymentProof,
      authUserId
    );
    res.status(200).send(result);
  };
}
