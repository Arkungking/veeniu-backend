import { profile } from "console";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import { UserUpdateDTO } from "./dto/user-update.dto";

export class UserUpdateService {
  private prisma: PrismaService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.prisma = new PrismaService();
    this.cloudinaryService = new CloudinaryService();
  }

  userUpdate = async (body: UserUpdateDTO, image?: Express.Multer.File) => {
  const user = await this.prisma.user.findFirst({
    where: { id: body.id },
  });

  if (!user) throw new ApiError("user not found", 404);

  let imageUrl = user.profilePicture;

  if (image) {
    if (user.profilePicture) await this.cloudinaryService.remove(user.profilePicture);
    const { secure_url } = await this.cloudinaryService.upload(image);
    imageUrl = secure_url;
  }

  const updateData: any = {};
  if (body.name) updateData.name = body.name;
  updateData.image = imageUrl;

  await this.prisma.user.update({
    where: { id: body.id },
    data: updateData,
  });

  return { message: "update user success" };
};
}
