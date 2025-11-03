import { NextFunction, Request, Response } from "express";

export function formatEventData(req: Request, res: Response, next: NextFunction) {
  if (req.body.totalSeats) req.body.totalSeats = Number(req.body.totalSeats);
  next();
}
