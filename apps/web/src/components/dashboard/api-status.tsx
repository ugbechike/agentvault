"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { apiBaseUrl } from "@/lib/format";

type Status = "loading" | "ok" | "offline";

export const ApiStatus = () => {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl()}/health`, { signal: controller.signal })
      .then((response) => setStatus(response.ok ? "ok" : "offline"))
      .catch(() => setStatus("offline"));
    return () => controller.abort();
  }, []);

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">AgentVault API</p>
        <p className="text-sm text-ink-soft">{apiBaseUrl()}/health</p>
      </div>
      {status === "loading" ? <Badge>Checking</Badge> : null}
      {status === "ok" ? <Badge tone="good">Reachable</Badge> : null}
      {status === "offline" ? <Badge tone="warn">Not running</Badge> : null}
    </div>
  );
};
