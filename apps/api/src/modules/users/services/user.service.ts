import type { UpdateProfileInput, UserProfile } from "@agentvault/shared";

import { NotImplementedError } from "@/lib/errors/app-error";

export const getCurrentUser = async (_userId: string): Promise<UserProfile> => {
  throw new NotImplementedError(
    "Current user lookup is not implemented.",
    "TODO(AUTH): Load the user row for the verified dashboard session.",
  );
};

export const updateCurrentUser = async (
  _userId: string,
  _input: UpdateProfileInput,
): Promise<UserProfile> => {
  throw new NotImplementedError(
    "Profile update is not implemented.",
    "TODO(AUTH): Update the signed-in user. Email changes need a fresh uniqueness check.",
  );
};
