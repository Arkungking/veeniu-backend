import express, { Express } from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import cors from "cors";
import { PORT } from "./config/env";
import { EventRouter } from "./modules/events/event.router";
import { VoucherRouter } from "./modules/vouchers/voucher.router";
import { AuthRouter } from "./modules/auth/auth.router";
import { TicketRouter } from "./modules/tickets/ticket.router";
import { TransactionRouter } from "./modules/transactions/transaction.router";
import { UserUpdateRouter } from "./modules/users/user.router";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    const authRouter = new AuthRouter();
    const eventRouter = new EventRouter();
    const voucherRouter = new VoucherRouter();
    const ticketRouter = new TicketRouter();
    const transactionRouter = new TransactionRouter();
    const userUpdateRouter = new UserUpdateRouter();
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/vouchers", voucherRouter.getRouter());
    this.app.use("/tickets", ticketRouter.getRouter());
    this.app.use("/transactions", transactionRouter.getRouter());
    this.app.use("/users", userUpdateRouter.getRouter());
  }

  private handleError() {
    this.app.use(errorMiddleware);
  }

  public start() {
    this.app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  }
}
