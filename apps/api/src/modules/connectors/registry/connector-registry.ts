import type { ProviderId } from "@agentvault/shared";

import { demoAdapter } from "@/modules/connectors/adapters/demo/demo.adapter";
import { githubAdapter } from "@/modules/connectors/adapters/github/github.adapter";
import { supabaseAdapter } from "@/modules/connectors/adapters/supabase/supabase.adapter";
import type { ConnectorAdapter } from "@/modules/connectors/adapters/connector-adapter";

const adapters: Record<ProviderId, ConnectorAdapter> = {
  demo: demoAdapter,
  github: githubAdapter,
  supabase: supabaseAdapter,
};

export const getConnectorAdapter = (provider: ProviderId): ConnectorAdapter => adapters[provider];

export const listConnectorAdapters = (): readonly ConnectorAdapter[] => Object.values(adapters);
