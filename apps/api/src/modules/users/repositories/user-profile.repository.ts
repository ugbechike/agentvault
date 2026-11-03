import { updateCurrentUser } from "@/modules/users/services/user.service";

export const updateUserProfile = async (userId: string, email: string, name: string) =>
  updateCurrentUser(userId, { email, name });
