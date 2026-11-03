"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/alert";

export const ForgotForm = () => {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Account</p>
        <h1 className="mt-2 font-serif text-4xl">Forgot password</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Password reset email is not configured. Sign in with the password from registration, then change it in Settings.
        </p>
      </div>
      <Alert tone="warn">No reset message is sent, and this page does not reveal whether an account exists.</Alert>
      <Link href="/sign-in" className="block text-sm text-ink-soft underline">
        Back to sign in
      </Link>
    </div>
  );
};
