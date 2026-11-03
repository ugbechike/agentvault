import { loginSchema, registerSchema } from "@agentvault/shared";
import { z } from "zod";

import { demoUser } from "@/modules/demo/fixtures";
import type { DemoSession } from "@/modules/demo/types";

export interface FieldFailure {
  ok: false;
  formError?: string;
  fieldErrors: Record<string, string>;
}

export interface AuthSuccess {
  ok: true;
  session: DemoSession;
  message: string;
}

export const fieldErrorsFrom = (error: z.ZodError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
};

export const signUpFormSchema = registerSchema
  .extend({ confirmPassword: z.string().min(8) })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const mockSignIn = (input: unknown): FieldFailure | AuthSuccess => {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  if (
    parsed.data.email.toLowerCase() !== demoUser.email ||
    parsed.data.password !== demoUser.password
  ) {
    return {
      ok: false,
      fieldErrors: {},
      formError: "Those demo credentials were not recognized. Use the account shown on this form.",
    };
  }
  return {
    ok: true,
    message: "Signed in to the browser demo. No password was checked on a server.",
    session: {
      userId: demoUser.userId,
      name: demoUser.name,
      email: demoUser.email,
      mock: true,
    },
  };
};

export const mockSignUp = (input: unknown): FieldFailure | AuthSuccess => {
  const parsed = signUpFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  return {
    ok: true,
    message: "This account exists only in this browser. No password was hashed or stored.",
    session: {
      userId: "usr_local",
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      mock: true,
    },
  };
};

export const mockForgotPassword = (
  input: unknown,
): FieldFailure | { ok: true; message: string } => {
  const parsed = z.object({ email: z.string().trim().email() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  return {
    ok: true,
    message: `If this were a real reset, a link would be sent to ${parsed.data.email}. No email was sent.`,
  };
};
