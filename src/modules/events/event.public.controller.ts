import { Request, Response } from "express";
import { EventService } from "./event.public.service";
import { Category, Location } from "../../generated/prisma";

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  getEvents = async (req: Request, res: Response) => {
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search as string;
    const category = req.query.category as Category;
    const location = req.query.location as Location;
    const result = await this.eventService.getEvents(
      page,
      limit,
      search,
      category,
      location
    );
    res.status(200).send(result);
  };

  getEvent = async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await this.eventService.getEvent(id);
    res.status(200).send(result);
  };
}
