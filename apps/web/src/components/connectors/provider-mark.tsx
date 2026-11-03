import { Database, HardDrive, Mail, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";

const marks: Record<string, ReactNode> = {
  demo: <span className="font-serif text-lg">Dm</span>,
  github: <span className="font-serif text-lg">Gh</span>,
  supabase: <Database size={18} />,
  gmail: <Mail size={18} />,
  "google-drive": <HardDrive size={18} />,
  notion: <NotebookPen size={18} />,
};

export const ProviderMark = ({ provider }: { provider: string }) => (
  <span className="grid size-11 place-items-center rounded-2xl bg-ink text-paper">
    {marks[provider] ?? provider.slice(0, 1).toUpperCase()}
  </span>
);
