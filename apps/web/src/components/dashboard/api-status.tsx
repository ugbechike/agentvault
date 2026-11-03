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
        <p className="text-sm font-medium">Workspace</p>
        <p className="text-sm text-ink-soft">
          {status === "ok" ? "Ready for connections" : status === "offline" ? "Unavailable right now" : "Checking status"}
        </p>
      </div>
      {status === "loading" ? <Badge>Checking</Badge> : null}
      {status === "ok" ? <Badge tone="good">Ready</Badge> : null}
      {status === "offline" ? <Badge tone="warn">Unavailable</Badge> : null}
    </div>
  );
};
