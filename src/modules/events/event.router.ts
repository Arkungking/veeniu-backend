import { Router } from "express";
import { OrgEventController } from "./event.org.controller";
import { EventController } from "./event.public.controller";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { JWT_SECRET } from "../../config/env";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateEventDTO } from "./dto/create-event.dto";
import { formatEventData } from "../../middlewares/format.middleware";
import { EditEventDTO } from "./dto/edit-event.dto";

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
    this.router.get(
      "/organizer/:organizerId",
      this.orgEventController.getEvents
    );
    this.router.post(
      "/create",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "thumbnail", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/avif",
        "image/png",
        "image/heic",
      ]),
      formatEventData,
      validateBody(CreateEventDTO),
      this.orgEventController.createEvent
    );
    this.router.get("/:id", this.eventController.getEvent);
    this.router.patch(
      "/edit/:eventId",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.uploaderMiddleware.upload().single("thumbnail"),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/avif",
        "image/png",
        "image/heic",
      ]),
      formatEventData,
      validateBody(EditEventDTO),
      this.orgEventController.editEvent
    );
    this.router.delete(
      "/delete/:id",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.orgEventController.deleteEvent
    );
  };

  getRouter = () => {
    return this.router;
  };
}
