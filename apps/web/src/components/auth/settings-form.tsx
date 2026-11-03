"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { logoutAccount } from "@/modules/auth/dashboard-auth";
import { updateProfileSchema } from "@agentvault/shared";

export const SettingsForm = () => {
  const { state, dispatch, resetWorkspace } = useDemoWorkspace();
  const router = useRouter();
  const session = state.session;
  const [profileMessage, setProfileMessage] = useState<string>();
  const [profileError, setProfileError] = useState<string>();
  const [passwordMessage, setPasswordMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description={`Signed in as ${session.email}. Profile edits stay in this browser.`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Profile</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const parsed = updateProfileSchema.safeParse({
                name: data.get("name"),
                email: data.get("email"),
              });
              if (!parsed.success) {
                setProfileError(parsed.error.issues[0]?.message ?? "Check the profile fields.");
                setProfileMessage(undefined);
                return;
              }
              dispatch({ type: "update-profile", name: parsed.data.name, email: parsed.data.email });
              setProfileError(undefined);
              setProfileMessage("Profile updated in local storage only.");
            }}
          >
            <Field label="Name" htmlFor="name" >
              <TextInput id="name" name="name" defaultValue={session.name} />
            </Field>
            <Field label="Email" htmlFor="settings-email">
              <TextInput id="settings-email" name="email" type="email" defaultValue={session.email} />
            </Field>
            {profileError ? <Alert tone="bad">{profileError}</Alert> : null}
            {profileMessage ? <Alert tone="good">{profileMessage}</Alert> : null}
            <Button type="submit">Save profile locally</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Password</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setPending(true);
              window.setTimeout(() => {
                setPending(false);
                setPasswordMessage(
                  "Password was not changed. Hashing and reset are unimplemented, and this demo does not pretend otherwise.",
                );
              }, 400);
            }}
          >
            <Field label="New password" htmlFor="new-password" hint="Stored nowhere.">
              <TextInput id="new-password" name="password" type="password" autoComplete="new-password" />
            </Field>
            {passwordMessage ? <Alert tone="warn">{passwordMessage}</Alert> : null}
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? "Checking…" : "Attempt password change"}
            </Button>
          </form>
        </Card>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Browser policy</h2>
          <p className="text-sm text-ink-soft">Clears agents and access choices stored in this browser. Connections stay on the API.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => resetWorkspace()}>
            Reset workspace
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              void logoutAccount().finally(() => {
                dispatch({ type: "sign-out" });
                router.push("/sign-in");
              });
            }}
          >
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
};
