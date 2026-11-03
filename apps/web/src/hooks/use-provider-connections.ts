"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listProviderConnections,
  type ProviderConnection,
} from "@/modules/connectors/connection-api";

export const useProviderConnections = () => {
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    try {
      setConnections(await listProviderConnections());
      setError(undefined);
    } catch (cause) {
      setConnections([]);
      setError(cause instanceof Error ? cause.message : "Could not load connections.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listProviderConnections()
      .then((next) => {
        if (cancelled) return;
        setConnections(next);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setConnections([]);
        setError(cause instanceof Error ? cause.message : "Could not load connections.");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { connections, error, ready, reload };
};
