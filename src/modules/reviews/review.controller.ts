import { Request, Response } from "express";
import { ReviewService } from "./review.service";

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  getReviews = async (req: Request, res: Response) => {
    const orgId = req.query.organizerId as string;
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const result = await this.reviewService.getReviews(orgId, page, limit);
    res.status(200).send(result);
  };

  createReview = async (req: Request, res: Response) => {
    const data = req.body;
    const result = await this.reviewService.createReview(data);
    res.status(200).send(result);
  };
}
