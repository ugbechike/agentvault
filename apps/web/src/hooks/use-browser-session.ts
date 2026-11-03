"use client";

import { useSyncExternalStore } from "react";

import { readBrowserSession, sessionEvent, type BrowserSession } from "@/modules/session/browser-session";

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener(sessionEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(sessionEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

export const useBrowserSession = (): BrowserSession | null =>
  useSyncExternalStore(subscribe, readBrowserSession, () => null);
