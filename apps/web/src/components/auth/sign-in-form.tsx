"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { loginAccount } from "@/modules/auth/dashboard-auth";

export const SignInForm = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        setFormError(undefined);
        void loginAccount({ email: data.get("email"), password: data.get("password") }).then((result) => {
          setPending(false);
          if (!result.ok) {
            setFormError(result.formError);
            setFieldErrors(result.fieldErrors);
            return;
          }
          router.push("/dashboard");
        });
      }}
    >
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Sign in</p>
        <h1 className="mt-2 font-serif text-4xl">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Use the email and password from the account you created.
        </p>
      </div>
      {formError ? <Alert tone="bad">{formError}</Alert> : null}
      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <TextInput id="email" name="email" type="email" autoComplete="username" />
      </Field>
      <Field label="Password" htmlFor="password" error={fieldErrors.password}>
        <TextInput id="password" name="password" type="password" autoComplete="current-password" />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="flex justify-between text-sm text-ink-soft">
        <Link href="/forgot-password" className="underline">
          Forgot password
        </Link>
        <Link href="/sign-up" className="underline">
          Create an account
        </Link>
      </p>
    </form>
  );
};
