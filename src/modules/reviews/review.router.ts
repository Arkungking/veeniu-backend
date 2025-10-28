import { Router } from "express";
import { ReviewController } from "./review.controller";

export class ReviewRouter {
  private router: Router;
  private reviewController: ReviewController;

  constructor() {
    this.router = Router();
    this.reviewController = new ReviewController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.reviewController.getReviews);
    this.router.post("/create", this.reviewController.createReview);
  };

  getRouter = () => {
    return this.router;
  };
}
