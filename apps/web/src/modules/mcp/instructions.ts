import { apiBaseUrl } from "@/lib/format";

export const placeholderMcpUrl = (): string => `${apiBaseUrl()}/mcp`;

export const cursorConfig = (url: string): string =>
  JSON.stringify(
    {
      mcpServers: {
        agentvault: {
          url,
          headers: {
            Authorization: "Bearer <paste the credential issued for this agent>",
          },
        },
      },
    },
    null,
    2,
  );

export const claudeCodeConfig = (url: string): string =>
  JSON.stringify(
    {
      mcpServers: {
        agentvault: {
          type: "http",
          url,
          headers: {
            Authorization: "Bearer <paste the credential issued for this agent>",
          },
        },
      },
    },
    null,
    2,
  );
