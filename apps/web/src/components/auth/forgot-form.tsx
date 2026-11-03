"use client";

import Link from "next/link";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";

export const ForgotForm = () => {
  const { forgotPassword } = useDemoWorkspace();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        setMessage(undefined);
        void forgotPassword({ email: data.get("email") }).then((result) => {
          setPending(false);
          if (!result.ok) {
            setFieldErrors(result.fieldErrors);
            return;
          }
          setFieldErrors({});
          setMessage(result.message);
        });
      }}
    >
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Mock reset</p>
        <h1 className="mt-2 font-serif text-4xl">Forgot password</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Reset delivery is not implemented. Submitting this form only shows what a future response would say.
        </p>
      </div>
      {message ? <Alert tone="good">{message}</Alert> : null}
      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <TextInput id="email" name="email" type="email" autoComplete="email" />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Preparing a simulated reply…" : "Simulate reset request"}
      </Button>
      <Link href="/sign-in" className="block text-sm text-ink-soft underline">
        Back to sign in
      </Link>
    </form>
  );
};
