import { capabilityCatalog } from "@agentvault/shared";

import { Badge } from "@/components/ui/badge";

const actionTitle = (name: string): string =>
  name
    .replaceAll(/[_./-]+/g, " ")
    .replaceAll(/\b\w/g, (letter) => letter.toUpperCase());

const accessLabel = (capabilityId: string): string => {
  const match = capabilityCatalog.find((capability) => capability.id === capabilityId);
  if (!match) return "Access";
  return match.id.endsWith(".write") ? "Write" : "Read";
};

export const ToolList = ({
  tools,
  empty,
}: {
  tools: readonly {
    id: string;
    name: string;
    description: string;
    requiredCapability: string;
  }[];
  empty: string;
}) => {
  if (tools.length === 0) {
    return <p className="text-sm text-ink-soft">{empty}</p>;
  }

  return (
    <ul className="space-y-4">
      {tools.map((tool) => (
        <li key={tool.id} className="rounded-2xl border border-line p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{actionTitle(tool.name)}</p>
            <Badge>{accessLabel(tool.requiredCapability)}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{tool.description || "Agents can use this action when you allow it."}</p>
        </li>
      ))}
    </ul>
  );
};
