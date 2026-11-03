import type { ToolCallRequest, ToolCallResult } from "@agentvault/shared";
import { connectUpstream } from "./client-manager";


export const invokeUpstreamTool = async (request: ToolCallRequest): Promise<ToolCallResult> => {
  const { handle } = await connectUpstream(request.connectionId);
  const result = await handle.client.callTool({
    name: request.upstreamToolName,
    arguments: request.arguments,
  });
  return {
    content: result.content.flatMap((block) =>
      block.type === "text" ? [{ type: "text" as const, text: block.text }] : [],
    ),
    isError: result.isError === true,
  }
};
