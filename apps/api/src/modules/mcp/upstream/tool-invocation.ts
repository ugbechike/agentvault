import { IntegrationError, type ToolCallRequest, type ToolCallResult } from "@agentvault/shared";

import { connectUpstream, disconnectUpstream } from "./client-manager";

export const invokeUpstreamTool = async (request: ToolCallRequest): Promise<ToolCallResult> => {
  try {
    const { handle } = await connectUpstream(request.connectionId);
    const result = await handle.client.callTool({
      name: request.upstreamToolName,
      arguments: request.arguments,
    });
    const content = Array.isArray(result.content) ? result.content : [];
    return {
      content: content.flatMap((block) =>
        block && typeof block === "object" && "type" in block && block.type === "text" && "text" in block && typeof block.text === "string"
          ? [{ type: "text" as const, text: block.text }]
          : [],
      ),
      isError: result.isError === true,
    };
  } catch (error) {
    await disconnectUpstream(request.connectionId);
    if (error instanceof IntegrationError) throw error;
    throw new IntegrationError("UPSTREAM_CALL_FAILED", "The upstream tool call failed.");
  }
};
