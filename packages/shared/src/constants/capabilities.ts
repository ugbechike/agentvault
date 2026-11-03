import type { ProviderId } from "./providers";

export const capabilityIds = [
  "demo.read",
  "github.read",
  "github.write",
  "supabase.read",
  "supabase.write",
] as const;

export type CapabilityId = (typeof capabilityIds)[number];

export interface CapabilityDefinition {
  id: CapabilityId;
  provider: ProviderId;
  label: string;
  description: string;
}

export const capabilityCatalog: readonly CapabilityDefinition[] = [
  {
    id: "demo.read",
    provider: "demo",
    label: "Demo read",
    description: "Call the synthetic read actions published by the demo provider.",
  },
  {
    id: "github.read",
    provider: "github",
    label: "GitHub read",
    description: "Read repositories, files, and issues on GitHub.",
  },
  {
    id: "github.write",
    provider: "github",
    label: "GitHub write",
    description: "Open issues and make other GitHub changes when you allow this agent to write.",
  },
  {
    id: "supabase.read",
    provider: "supabase",
    label: "Supabase read",
    description: "View tables in the selected Supabase project. Arbitrary SQL is not included.",
  },
  {
    id: "supabase.write",
    provider: "supabase",
    label: "Supabase write",
    description: "Change data in the selected Supabase project when you allow this agent to write.",
  },
];
