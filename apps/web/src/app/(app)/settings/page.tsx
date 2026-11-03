import type { Metadata } from "next";

import { SettingsForm } from "@/components/auth/settings-form";

export const metadata: Metadata = { title: "Settings" };

const SettingsPage = () => <SettingsForm />;

export default SettingsPage;
