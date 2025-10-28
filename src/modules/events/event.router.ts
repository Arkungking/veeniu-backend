import { Router } from "express";
import { OrgEventController } from "./event.org.controller";
import { EventController } from "./event.public.controller";

export class EventRouter {
  private router: Router;
  private orgEventController: OrgEventController;
  private eventController: EventController;

  constructor() {
    this.router = Router();
    this.orgEventController = new OrgEventController();
    this.eventController = new EventController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.eventController.getEvents);
    this.router.get("/organizer", this.orgEventController.getEvents);
    this.router.post("/create", this.orgEventController.createEvent);
    this.router.get("/:id", this.eventController.getEvent);
    this.router.patch("/:id", this.orgEventController.editEvent);
    this.router.delete("/delete/:id", this.orgEventController.deleteEvent);
  };

  getRouter = () => {
    return this.router;
  };
}
