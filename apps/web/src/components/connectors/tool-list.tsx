import { Badge } from "@/components/ui/badge";
export const ToolList = ({
  tools,
  empty,
  discovered = false,
}: {
  tools: readonly {
    id: string;
    agentvaultName: string;
    upstreamName: string;
    description: string;
    inputSchema: unknown;
    requiredCapability: string;
  }[];
  empty: string;
  discovered?: boolean;
}) => {
  if (tools.length === 0) {
    return <p className="text-sm text-ink-soft">{empty}</p>;
  }

  return (
    <ul className="space-y-4">
      {tools.map((tool) => (
        <li key={tool.id} className="rounded-2xl border border-line p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{tool.agentvaultName}</p>
            <Badge tone="copper">{discovered ? "Discovered" : "Fixture"}</Badge>
            <Badge>{tool.requiredCapability}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{tool.description}</p>
          <p className="mt-2 text-xs text-ink-soft">
            Upstream name: {tool.upstreamName}.{discovered ? "" : " This name is illustrative and was not discovered."}
          </p>
          <pre className="mt-3 overflow-auto rounded-2xl bg-ink px-3 py-3 text-xs leading-5 text-paper">
            {JSON.stringify(tool.inputSchema, null, 2)}
          </pre>
        </li>
      ))}
    </ul>
  );
};
