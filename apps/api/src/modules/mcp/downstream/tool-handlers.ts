import { illustrativeAllowlist, type DownstreamToolContext, type McpConsumerIdentity, type ToolCallResult } from "@agentvault/shared";

import { AppError } from "@/lib/errors/app-error";
import { authenticateMcpConsumer } from "@/modules/auth/services/mcp-consumer-auth.service";
import { recordAuditLog } from "@/modules/audit/services/audit.service";
import { callRoutedTool, routeToolCall } from "@/modules/mcp/gateway/tool-router";
import { evaluateEffectiveAccess } from "@/modules/permissions/policies/effective-access";

import { listAdvertisedTools, type AdvertisedTool } from "./tool-registry";

const textResult = (text: string, isError: boolean): ToolCallResult => ({
  content: [{ type: "text", text }],
  isError,
});

export const handleToolsList = async (agentId: string): Promise<readonly AdvertisedTool[]> => listAdvertisedTools(agentId);

export const handleToolsCall = async (context: DownstreamToolContext): Promise<ToolCallResult> => {
  const started = Date.now();
  const match = illustrativeAllowlist.find((tool) => tool.agentvaultName === context.agentvaultToolName);
  const finish = async (
    result: ToolCallResult,
    decision: "allow" | "deny",
    status: "success" | "failure" | "denied",
    connectionId: string | null,
    errorCode: string | null,
  ): Promise<ToolCallResult> => {
    await recordAuditLog({
      userId: context.userId,
      agentId: context.agentId,
      connectionId,
      toolName: context.agentvaultToolName,
      decision,
      status,
      durationMs: Date.now() - started,
      errorCode,
    }).catch(() => undefined);
    return result;
  };

  if (!match) {
    return finish(textResult("That tool is not available.", true), "deny", "denied", null, "TOOL_NOT_ALLOWLISTED");
  }

  let connectionId: string | null = null;
  try {
    const routed = await routeToolCall(context.userId, context.agentvaultToolName, context.arguments);
    connectionId = routed.upstream.connectionId;
    const decision = await evaluateEffectiveAccess(
      {
        agentId: context.agentId,
        connectionId,
        toolName: context.agentvaultToolName,
        capability: match.requiredCapability,
      },
      { arguments: context.arguments },
    );
    if (decision.outcome !== "allow") {
      return finish(textResult(decision.reason, true), "deny", "denied", connectionId, decision.reasonCode);
    }
    const result = await callRoutedTool(routed);
    return finish(
      result,
      "allow",
      result.isError ? "failure" : "success",
      connectionId,
      result.isError ? "UPSTREAM_FAILURE" : null,
    );
  } catch (error) {
    const code = error instanceof AppError ? error.code : "TOOL_CALL_FAILED";
    const message = error instanceof AppError ? error.message : "The tool call was rejected.";
    return finish(textResult(message, true), "deny", "denied", connectionId, code);
  }
};

export const authenticateCaller = async (authorizationHeader: string | undefined): Promise<McpConsumerIdentity> =>
  authenticateMcpConsumer(authorizationHeader);
