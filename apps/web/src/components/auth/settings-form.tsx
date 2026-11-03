"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { useBrowserSession } from "@/hooks/use-browser-session";
import { apiRequest } from "@/modules/api/client";
import { logoutAccount } from "@/modules/auth/dashboard-auth";
import { writeBrowserSession } from "@/modules/session/browser-session";
import { updateProfileSchema } from "@agentvault/shared";

export const SettingsForm = () => {
  const session = useBrowserSession();
  const router = useRouter();
  const [profileMessage, setProfileMessage] = useState<string>();
  const [profileError, setProfileError] = useState<string>();
  const [passwordMessage, setPasswordMessage] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [pending, setPending] = useState(false);

  if (!session) return null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Account" title="Settings" description={`Signed in as ${session.email}.`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Profile</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const parsed = updateProfileSchema.safeParse({ name: data.get("name"), email: data.get("email") });
              if (!parsed.success) {
                setProfileError(parsed.error.issues[0]?.message ?? "Check the profile fields.");
                setProfileMessage(undefined);
                return;
              }
              setPending(true);
              void apiRequest<{ id: string; email: string; name: string }>("/api/users/me", {
                method: "PATCH",
                body: JSON.stringify(parsed.data),
              })
                .then((profile) => {
                  writeBrowserSession({ ...session, email: profile.email, name: profile.name, userId: profile.id });
                  setProfileError(undefined);
                  setProfileMessage("Profile saved.");
                })
                .catch((cause: unknown) => setProfileError(cause instanceof Error ? cause.message : "Profile could not be saved."))
                .finally(() => setPending(false));
            }}
          >
            <Field label="Name" htmlFor="name">
              <TextInput id="name" name="name" defaultValue={session.name} />
            </Field>
            <Field label="Email" htmlFor="settings-email">
              <TextInput id="settings-email" name="email" type="email" defaultValue={session.email} />
            </Field>
            {profileError ? <Alert tone="bad">{profileError}</Alert> : null}
            {profileMessage ? <Alert tone="good">{profileMessage}</Alert> : null}
            <Button type="submit" disabled={pending}>Save profile</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Password</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setPending(true);
              void apiRequest("/api/users/me/password", {
                method: "POST",
                body: JSON.stringify({
                  currentPassword: data.get("currentPassword"),
                  newPassword: data.get("newPassword"),
                }),
              })
                .then(() => {
                  setPasswordError(undefined);
                  setPasswordMessage("Password updated.");
                })
                .catch((cause: unknown) => setPasswordError(cause instanceof Error ? cause.message : "Password could not be changed."))
                .finally(() => setPending(false));
            }}
          >
            <Field label="Current password" htmlFor="current-password">
              <TextInput id="current-password" name="currentPassword" type="password" autoComplete="current-password" />
            </Field>
            <Field label="New password" htmlFor="new-password">
              <TextInput id="new-password" name="newPassword" type="password" autoComplete="new-password" />
            </Field>
            {passwordError ? <Alert tone="bad">{passwordError}</Alert> : null}
            {passwordMessage ? <Alert tone="good">{passwordMessage}</Alert> : null}
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? "Saving…" : "Change password"}
            </Button>
          </form>
        </Card>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Sign out</h2>
          <p className="text-sm text-ink-soft">Ends this browser session and revokes its refresh token.</p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            void logoutAccount().finally(() => router.push("/sign-in"));
          }}
        >
          Sign out
        </Button>
      </Card>
    </div>
  );
};
