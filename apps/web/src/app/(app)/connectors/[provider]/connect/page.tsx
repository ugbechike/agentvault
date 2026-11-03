import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DemoConnectFlow } from "@/components/connectors/demo-connect-flow";

export const metadata: Metadata = { title: "Connect Demo Provider" };

const ConnectPage = async ({ params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  if (provider !== "demo") notFound();
  return <DemoConnectFlow />;
};

export default ConnectPage;
