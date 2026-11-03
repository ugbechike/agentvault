import { initialDemoState } from "@/modules/demo/fixtures";
import type { DemoState } from "@/modules/demo/types";

const storageKey = "agentvault-poc-demo-v1";
const changeEvent = "agentvault-demo-change";

let cachedRaw: string | null = null;
let cachedState: DemoState = initialDemoState;

const parseState = (raw: string | null): DemoState => {
  if (!raw) {
    return initialDemoState;
  }
  try {
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed && Array.isArray(parsed.connections) && Array.isArray(parsed.agents)) {
      return { ...initialDemoState, ...parsed, session: parsed.session ?? null };
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
  return initialDemoState;
};

export const subscribeDemo = (listener: () => void): (() => void) => {
  const onChange = () => listener();
  window.addEventListener(changeEvent, onChange);
  return () => window.removeEventListener(changeEvent, onChange);
};

export const getDemoSnapshot = (): DemoState => {
  const raw = localStorage.getItem(storageKey);
  if (raw === cachedRaw) {
    return cachedState;
  }
  cachedRaw = raw;
  cachedState = parseState(raw);
  return cachedState;
};

export const getDemoServerSnapshot = (): DemoState => initialDemoState;

export const writeDemo = (state: DemoState): void => {
  const raw = JSON.stringify(state);
  localStorage.setItem(storageKey, raw);
  cachedRaw = raw;
  cachedState = state;
  window.dispatchEvent(new Event(changeEvent));
};
