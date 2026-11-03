import { ShieldCheck, Vault } from "lucide-react";
import type { ReactNode } from "react";

const points = [
  "You authorize the provider.",
  "You choose what each agent may do.",
  "Effective access is the overlap, checked on every call.",
];

export const AuthFrame = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-paper">
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sidebar px-12 py-12 text-paper lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-copper">
            <Vault size={18} />
          </span>
          <span className="font-serif text-2xl">AgentVault</span>
        </div>
        <div>
          <h1 className="max-w-md font-serif text-5xl leading-tight">
            A gate between agents and the services they touch.
          </h1>
          <ul className="mt-8 space-y-3 text-sm text-paper/75">
            {points.map((point) => (
              <li key={point} className="flex gap-2">
                <ShieldCheck size={16} className="mt-0.5 text-copper" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-paper/50">Experimental POC. Not a production identity system.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  </div>
);
