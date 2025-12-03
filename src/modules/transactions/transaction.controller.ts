import { Request, Response } from "express";
import { TransactionService } from "./transaction.service";
import { ApiError } from "../../utils/api-error";

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  getTransaction = async (req: Request, res: Response) => {
    const transactionId = req.params.transactionId;
    const authUserId = String(res.locals.user.id);
    const result = await this.transactionService.getTransaction(
      transactionId,
      authUserId
    );
    res.status(200).send(result);
  };

  getUserTransactions = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const authUserId = String(res.locals.user.id);
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search as string;
    const result = await this.transactionService.getUserTransactions(
      userId,
      authUserId,
      page,
      limit,
      search
    );
    res.status(200).send(result);
  };

  getOrgTransactions = async (req: Request, res: Response) => {
    const orgId = req.params.orgId;
    const authOrgId = String(res.locals.user.id);
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search as string;
    const result = await this.transactionService.getOrgTransactions(
      orgId,
      authOrgId,
      page,
      limit,
      search
    );
    res.status(200).send(result);
  };

  getUserTickets = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const authUserId = String(res.locals.user.id);
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const result = await this.transactionService.getUserTickets(
      userId,
      authUserId,
      page,
      limit
    );
    res.status(200).send(result);
  };

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

  setTransactionStatus = async (req: Request, res: Response) => {
    const uuid = req.params.uuid;
    const body = req.body;
    const authUserId = String(res.locals.user.id);
    const result = await this.transactionService.setTransactionStatus(
      uuid,
      body,
      authUserId
    );
    res.status(200).send(result);
  };
}
