import { loginSchema, type DashboardSession, type UserProfile } from "@agentvault/shared";

import { apiRequest } from "@/modules/api/client";
import { clearBrowserSession, readBrowserSession, writeBrowserSession, type BrowserSession } from "@/modules/session/browser-session";

import { fieldErrorsFrom, signUpFormSchema, type FieldFailure } from "./mock-auth";

export const accessTokenStorageKey = "agentvault-access-token";

export const logoutAccount = async (): Promise<void> => {
  const session = readBrowserSession();
  try {
    if (!session) return;
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {
    // The local session is cleared even when the API is unreachable.
  } finally {
    clearBrowserSession();
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
  const { apiBaseUrl } = await import("@/lib/format");
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
): Promise<FieldFailure | { ok: true; message: string; session: BrowserSession }> => {
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
    const email = parsed.data.email.toLowerCase();
    writeBrowserSession({
      userId: body.userId,
      email,
      name: email.split("@")[0] || email,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresAt: body.expiresAt,
    });
    const profile = await apiRequest<UserProfile>("/api/users/me");
    const session: BrowserSession = {
      userId: profile.id,
      email: profile.email,
      name: profile.name || email,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresAt: body.expiresAt,
    };
    writeBrowserSession(session);
    return { ok: true, message: "Signed in.", session };
  } catch {
    clearBrowserSession();
    return { ok: false, fieldErrors: {}, formError: "The API could not be reached." };
  }
};
