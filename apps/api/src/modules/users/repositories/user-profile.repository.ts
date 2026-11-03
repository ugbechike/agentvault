import { NotImplementedError } from "@/lib/errors/app-error";

export const updateUserProfile = async (_userId: string, _email: string): Promise<never> => {
  throw new NotImplementedError(
    "User profile persistence is not implemented.",
    "TODO(AUTH): Update users through getDatabase().",
  );
};
