import { Router } from "express";
import { TicketController } from "./ticket.controller";

export class TicketRouter {
  private router: Router;
  private ticketController: TicketController;

  constructor() {
    this.router = Router();
    this.ticketController = new TicketController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.ticketController.getTickets);
    this.router.get("/:id", this.ticketController.getTicket);
    this.router.post("/create", this.ticketController.createTicket);
    this.router.delete("/delete/:id", this.ticketController.deleteTicket);
  };

  getRouter = () => {
    return this.router;
  };
}
