import { Router } from "express";
import { TicketController } from "./ticket.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { JWT_SECRET } from "../../config/env";

export class TicketRouter {
  private router: Router;
  private ticketController: TicketController;
  private jwtMiddleware: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.ticketController = new TicketController();
    this.jwtMiddleware = new JwtMiddleware();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.ticketController.getTickets);
    this.router.get("/:id", this.ticketController.getTicket);
    this.router.get(
      "/organizer/:organizerId",
      this.ticketController.getOrgTickets
    );
    this.router.post(
      "/create",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.ticketController.createTicket
    );
    this.router.delete("/delete/:id", this.ticketController.deleteTicket);
  };

  getRouter = () => {
    return this.router;
  };
}
