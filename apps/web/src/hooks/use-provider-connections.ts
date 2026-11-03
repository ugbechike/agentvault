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
    void reload();
  }, [reload]);

  return { connections, error, ready, reload };
};
