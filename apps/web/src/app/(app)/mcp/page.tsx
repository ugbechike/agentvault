import type { Metadata } from "next";

import { McpAccess } from "@/components/mcp/mcp-access";

export const metadata: Metadata = { title: "MCP access" };

const McpPage = () => <McpAccess />;

export default McpPage;
