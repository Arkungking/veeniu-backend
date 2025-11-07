import { Router } from "express";
import { TransactionController } from "./transaction.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { JWT_SECRET } from "../../config/env";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { UploadPaymentProofDTO } from "./dto/upload-payment-proof.dto";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { SetTransactionStatusDTO } from "./dto/set-transaction-status.dto";

export class TransactionRouter {
  private router: Router;
  private transactionController: TransactionController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.post(
      "/create",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CUSTOMER"]),
      validateBody(CreateTransactionDTO),
      this.transactionController.createTransaction
    );

    this.router.patch(
      "/status/:uuid",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      validateBody(SetTransactionStatusDTO),
      this.transactionController.setTransactionStatus
    );

    this.router.patch(
      "/payment-proof",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CUSTOMER"]),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "paymentProof", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/png",
        "image/heic",
      ]),
      validateBody(UploadPaymentProofDTO),
      this.transactionController.uploadPaymentProof
    );

    this.router.get(
      "/tickets/:userId",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CUSTOMER"]),
      this.transactionController.getUserTickets
    );

    this.router.get(
      "/organizer/:orgId",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.transactionController.getOrgTransactions
    );

    this.router.get(
      "/user/:userId",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CUSTOMER"]),
      this.transactionController.getUserTransactions
    );

    this.router.get(
      "/:transactionId",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CUSTOMER"]),
      this.transactionController.getTransaction
    );
  };

  getRouter = () => {
    return this.router;
  };
}
