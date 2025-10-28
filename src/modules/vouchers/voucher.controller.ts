import { Request, Response } from "express";
import { VoucherService } from "./voucher.service";

export class VoucherController {
  private voucherService: VoucherService;

  constructor() {
    this.voucherService = new VoucherService();
  }

  getVouchers = async (req: Request, res: Response) => {
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search as string;
    const result = await this.voucherService.getVouchers(page, limit, search);
    res.status(200).send(result);
  };

  getVoucher = async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await this.voucherService.getVoucher(id);
    res.status(200).send(result);
  };

  createVoucher = async (req: Request, res: Response) => {
    const data = req.body;
    const result = await this.voucherService.createVoucher(data);
    res.status(200).send(result);
  };

  deleteVoucher = async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await this.voucherService.deleteVoucher(id);
    res.status(200).send(result);
  };
}
