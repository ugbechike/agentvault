"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";

export const SignUpForm = () => {
  const { signUp } = useDemoWorkspace();
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
        void signUp({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
          confirmPassword: data.get("confirmPassword"),
        }).then((result) => {
          setPending(false);
          if (!result.ok) {
            setFormError(result.formError);
            setFieldErrors(result.fieldErrors);
            return;
          }
          router.push("/sign-in");
        });
      }}
    >
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Create account</p>
        <h1 className="mt-2 font-serif text-4xl">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          After the account is saved, sign in with this email and password.
        </p>
      </div>
      {formError ? <Alert tone="bad">{formError}</Alert> : null}
      <Field label="Name" htmlFor="name" error={fieldErrors.name}>
        <TextInput id="name" name="name" autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <TextInput id="email" name="email" type="email" autoComplete="email" />
      </Field>
      <Field label="Password" htmlFor="password" error={fieldErrors.password} hint="At least 8 characters.">
        <TextInput id="password" name="password" type="password" autoComplete="new-password" />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
        <TextInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-sm text-ink-soft">
        Already using the demo?{" "}
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
};
