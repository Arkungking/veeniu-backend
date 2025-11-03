import { Request, Response } from "express";
import { Category, Location } from "../../generated/prisma";
import { OrgEventService } from "./event.org.service";

export class OrgEventController {
  private orgEventService: OrgEventService;

  constructor() {
    this.orgEventService = new OrgEventService();
  }

  getEvents = async (req: Request, res: Response) => {
    const orgId = req.body;
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search as string;
    const category = req.query.category as Category;
    const location = req.query.location as Location;
    const result = await this.orgEventService.getOrgEvents(
      orgId,
      page,
      limit,
      search,
      category,
      location
    );
    res.status(200).send(result);
  };
  createEvent = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files.thumbnail?.[0];
    const result = await this.orgEventService.createEvent(req.body, thumbnail);
    res.status(200).send(result);
  };
  editEvent = async (req: Request, res: Response) => {
    const data = req.body;
    const result = await this.orgEventService.editEvent(data);
    res.status(200).send(result);
  };
  deleteEvent = async (req: Request, res: Response) => {
    const id = req.body;
    const result = await this.orgEventService.deleteEvent(id);
    res.status(200).send(result);
  };
}
