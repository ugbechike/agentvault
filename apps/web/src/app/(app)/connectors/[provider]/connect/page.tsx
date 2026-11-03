import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GithubConnectFlow } from "@/components/connectors/github-connect-flow";
import { SupabaseConnectFlow } from "@/components/connectors/supabase-connect-flow";

export const metadata: Metadata = { title: "Connect" };

const ConnectPage = async ({ params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  if (provider === "github") {
    return <GithubConnectFlow />;
  }
  if (provider === "supabase") {
    return <SupabaseConnectFlow />;
  }
  notFound();
};

export default ConnectPage;
