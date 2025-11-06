import { Request, Response } from "express";
import { TicketService } from "./ticket.service";

export class TicketController {
  private ticketService: TicketService;

  constructor() {
    this.ticketService = new TicketService();
  }

  getTickets = async (req: Request, res: Response) => {
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search as string;
    const result = await this.ticketService.getTickets(page, limit, search);
    res.status(200).send(result);
  };

  getOrgTickets = async (req: Request, res: Response) => {
    const orgId = req.query.organizerId as string;
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 20);
    const search = req.query.search as string;
    const result = await this.ticketService.getOrgTickets(
      orgId,
      page,
      limit,
      search
    );
    res.status(200).send(result);
  };

  getTicket = async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await this.ticketService.getTicket(id);
    res.status(200).send(result);
  };

  createTicket = async (req: Request, res: Response) => {
    const data = req.body;
    const result = await this.ticketService.createTicket(data);
    res.status(200).send(result);
  };

    editTicket = async (req: Request, res: Response) => {
    const id = req.params.id
    const data = req.body;
    const result = await this.ticketService.editTicket(id, data);
    res.status(200).send(result);
  };

  deleteTicket = async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await this.ticketService.deleteTicket(id);
    res.status(200).send(result);
  };
}
