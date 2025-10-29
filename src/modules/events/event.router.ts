import { Router } from "express";
import { OrgEventController } from "./event.org.controller";
import { EventController } from "./event.public.controller";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { JWT_SECRET } from "../../config/env";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateEventDTO } from "./dto/create-event.dto";

export class EventRouter {
  private router: Router;
  private orgEventController: OrgEventController;
  private eventController: EventController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.orgEventController = new OrgEventController();
    this.eventController = new EventController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.eventController.getEvents);
    this.router.get("/latest", this.eventController.getLatestEvent);
    this.router.get("/random", this.eventController.getRandomEvent);
    this.router.get("/organizer", this.orgEventController.getEvents);
    this.router.post(
      "/create",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "profilePicture", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/png",
        "image/heic",
      ]),
      validateBody(CreateEventDTO),
      this.orgEventController.createEvent
    );
    this.router.get("/:id", this.eventController.getEvent);
    this.router.patch("/edit", this.orgEventController.editEvent);
    this.router.delete("/delete", this.orgEventController.deleteEvent);
  };

  getRouter = () => {
    return this.router;
  };
}
