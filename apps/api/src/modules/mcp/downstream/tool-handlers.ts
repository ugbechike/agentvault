import { illustrativeAllowlist, McpConsumerIdentity, type DownstreamToolContext, type ToolCallResult } from "@agentvault/shared";

import { AdvertisedTool, listAdvertisedTools } from "./tool-registry";
import { authenticateMcpConsumer } from "@/modules/auth/services/mcp-consumer-auth.service";
import { callRoutedTool, routeToolCall } from "../gateway/tool-router";
import { evaluateEffectiveAccess } from "@/modules/permissions/policies/effective-access";

export const handleToolsList = async (agentId: string): Promise<readonly AdvertisedTool[]>=> {
  return await listAdvertisedTools(agentId);
};

// Note: the wrapper to handle tool calls
export const handleToolsCall = async (context: DownstreamToolContext): Promise<ToolCallResult> => {
  // Note: Match and check if the tool is allowlisted
  const match = illustrativeAllowlist.find(tool => tool.agentvaultName === context.agentvaultToolName);
  if (!match) {
    throw new Error(`Tool ${context.agentvaultToolName} not found in allowlist`);
  }

  // Note: Route the tool call to the upstream tool
  const routed = await routeToolCall(context.userId, context.agentvaultToolName, context.arguments);

  // Note: Evaluate the effective access to the tool
  const decision = await evaluateEffectiveAccess({
    agentId: context.agentId,
    connectionId: routed.upstream.connectionId,
    toolName: routed.agentvaultToolName,
    capability: match.requiredCapability,
  });

  if (decision.outcome !== "allow") {
    return {
      content: [{
        type: "text",
        text: decision.reason,
      }],
      isError: true,
    }
  }

  // Note: Call the upstream tool
  return callRoutedTool(routed);
 
};

export const authenticateCaller = async (authorizationHeader: string | undefined): Promise<McpConsumerIdentity>=> {
  return await authenticateMcpConsumer(authorizationHeader);
};
