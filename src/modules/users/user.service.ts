import { PrismaService } from "../prisma/prisma.service";
import { UserUpdateDTO } from "./dto/user-update.dto";

export class userService {
    private prisma: PrismaService;
    constructor() {
        this.prisma = new PrismaService();
    }

    userUpdate = async (body:UserUpdateDTO) => {}
}