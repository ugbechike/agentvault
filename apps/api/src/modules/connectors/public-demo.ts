import { AppError } from "@/lib/errors/app-error";

/** The only provider a public demo user may connect, validate, or invoke. */
export const PUBLIC_DEMO_PROVIDER = "demo" as const;

export const assertPublicDemoProvider = (provider: string): void => {
  if (provider !== PUBLIC_DEMO_PROVIDER) {
    throw new AppError(403, "PROVIDER_DISABLED", "This provider is not available in the public demo.");
  }
};
