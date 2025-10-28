import { Router } from "express";
import { VoucherController } from "./voucher.controller";

export class VoucherRouter {
  private router: Router;
  private voucherController: VoucherController;

  constructor() {
    this.router = Router();
    this.voucherController = new VoucherController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.voucherController.getVouchers);
    this.router.get("/:id", this.voucherController.getVoucher);
    this.router.post("/create", this.voucherController.createVoucher);
    this.router.delete("/delete/:id", this.voucherController.deleteVoucher);
  };

  getRouter = () => {
    return this.router;
  };
}
