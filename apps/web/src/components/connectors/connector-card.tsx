import Link from "next/link";

import {
  connectLabel,
  manageConnectionLabel,
  notConnectedStatus,
  testConnectionStatus,
} from "@/components/connectors/labels";
import { ProviderMark } from "@/components/connectors/provider-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ConnectorCatalogEntry } from "@agentvault/shared";

export const ConnectorCard = ({
  entry,
  connected,
}: {
  entry: ConnectorCatalogEntry;
  connected: boolean;
}) => {
  const available = entry.status === "available";

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <ProviderMark provider={entry.provider} />
        {available ? (
          <Badge tone={connected ? "copper" : "neutral"}>{connected ? testConnectionStatus : notConnectedStatus}</Badge>
        ) : (
          <Badge tone="warn">Coming soon</Badge>
        )}
      </div>
      <h2 className="mt-4 font-serif text-2xl">{entry.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">{entry.description}</p>
      <ul className="mt-4 space-y-1 text-sm text-ink">
        {entry.capabilities.map((capability) => (
          <li key={capability}>· {capability}</li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        {available ? (
          connected ? (
            <Link href={`/connectors/${entry.provider}`}>
              <Button>{manageConnectionLabel}</Button>
            </Link>
          ) : (
            <>
              <Link href={`/connectors/${entry.provider}/connect`}>
                <Button>{connectLabel(entry.name)}</Button>
              </Link>
              <Link href={`/connectors/${entry.provider}`}>
                <Button variant="secondary">{manageConnectionLabel}</Button>
              </Link>
            </>
          )
        ) : (
          <Button disabled>Coming soon</Button>
        )}
      </div>
    </Card>
  );
};
