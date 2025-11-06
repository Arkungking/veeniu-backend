import { Router } from "express";
import { VoucherController } from "./voucher.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { JWT_SECRET } from "../../config/env";

export class VoucherRouter {
  private router: Router;
  private voucherController: VoucherController;
  private jwtMiddleware: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.voucherController = new VoucherController();
    this.jwtMiddleware = new JwtMiddleware();

    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.voucherController.getVouchers);
    this.router.get("/:id", this.voucherController.getVoucher);
    this.router.get(
      "/organizer/:organizerId",
      this.voucherController.getOrgVouchers
    );
    this.router.post(
      "/create",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.voucherController.createVoucher
    );
    this.router.patch(
      "/edit/:id",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ORGANIZER"]),
      this.voucherController.editVoucher
    );
    this.router.delete("/delete/:id", this.voucherController.deleteVoucher);
  };

  getRouter = () => {
    return this.router;
  };
}
