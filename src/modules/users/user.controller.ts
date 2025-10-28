import { Request, Response } from "express";
import { UserUpdateService } from "./user.service";

export class UserUpdateController {
  private userUpdateservice: UserUpdateService;

  constructor() {
    this.userUpdateservice = new UserUpdateService();
  }

  userUpdate = async (req: Request, res: Response) => {
  const body = req.body;
  const file = req.files as { [fieldname: string]: Express.Multer.File[] };
  const image = file.image?.[0];
  const result = await this.userUpdateservice.userUpdate(body, image);
  res.status(200).send(result);
};
}