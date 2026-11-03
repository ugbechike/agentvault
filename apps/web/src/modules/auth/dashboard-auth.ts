import { loginSchema, type DashboardSession } from "@agentvault/shared";

import { apiBaseUrl } from "@/lib/format";
import type { DemoSession } from "@/modules/demo/types";

import { fieldErrorsFrom, signUpFormSchema, type FieldFailure } from "./mock-auth";

export const accessTokenStorageKey = "agentvault-access-token";

export const logoutAccount = async (): Promise<void> => {
  const token = localStorage.getItem(accessTokenStorageKey);
  try {
    if (!token) return;
    await fetch(`${apiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
  } finally {
    localStorage.removeItem(accessTokenStorageKey);
  }
};

interface ApiFailure {
  error?: {
    message?: string;
    issues?: { path: string; message: string }[];
  };
}

const failureFromResponse = async (response: Response): Promise<FieldFailure> => {
  const body = (await response.json().catch(() => null)) as ApiFailure | null;
  const fieldErrors: Record<string, string> = {};
  for (const issue of body?.error?.issues ?? []) {
    if (issue.path && !fieldErrors[issue.path]) {
      fieldErrors[issue.path] = issue.message;
    }
  }
  return {
    ok: false,
    fieldErrors,
    formError: body?.error?.message ?? "The request failed.",
  };
};

const postJson = async (path: string, body: unknown): Promise<Response> => {
  return fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
};

export const registerAccount = async (input: unknown): Promise<FieldFailure | { ok: true }> => {
  const parsed = signUpFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const response = await postJson("/api/auth/register", {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (!response.ok) return failureFromResponse(response);
    return { ok: true };
  } catch {
    return { ok: false, fieldErrors: {}, formError: "The API could not be reached." };
  }
};

export const loginAccount = async (
  input: unknown,
): Promise<FieldFailure | { ok: true; message: string; session: DemoSession }> => {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const response = await postJson("/api/auth/login", {
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (!response.ok) return failureFromResponse(response);
    const body = (await response.json()) as DashboardSession;
    localStorage.setItem(accessTokenStorageKey, body.accessToken);
    const email = parsed.data.email.toLowerCase();
    const name = email.split("@")[0] || email;
    return {
      ok: true,
      message: "Signed in.",
      session: {
        userId: body.userId,
        name,
        email,
        mock: true,
      },
    };
  } catch {
    return { ok: false, fieldErrors: {}, formError: "The API could not be reached." };
  }
};
