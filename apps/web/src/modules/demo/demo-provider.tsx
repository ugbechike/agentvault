"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

import { loginAccount, registerAccount } from "@/modules/auth/dashboard-auth";
import {
  mockForgotPassword,
  type AuthSuccess,
  type FieldFailure,
} from "@/modules/auth/mock-auth";
import { demoReducer, type ConnectSimulation, type DemoAction } from "@/modules/demo/demo-state";
import { getDemoServerSnapshot, getDemoSnapshot, subscribeDemo, writeDemo } from "@/modules/demo/demo-store";
import type { DemoState } from "@/modules/demo/types";

interface DemoWorkspaceValue {
  state: DemoState;
  hydrated: boolean;
  dispatch: (action: DemoAction) => void;
  signIn: (input: unknown) => Promise<FieldFailure | AuthSuccess>;
  signUp: (input: unknown) => Promise<FieldFailure | { ok: true }>;
  forgotPassword: (input: unknown) => Promise<ReturnType<typeof mockForgotPassword>>;
  connect: (input: ConnectSimulation) => void;
  resetWorkspace: () => void;
}

const DemoContext = createContext<DemoWorkspaceValue | null>(null);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const updateDemo = (recipe: (current: DemoState) => DemoState): void => {
  writeDemo(recipe(getDemoSnapshot()));
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const state = useSyncExternalStore(subscribeDemo, getDemoSnapshot, getDemoServerSnapshot);

  const value = useMemo<DemoWorkspaceValue>(
    () => ({
      state,
      hydrated: true,
      dispatch: (action) => updateDemo((current) => demoReducer(current, action)),
      signIn: async (input) => {
        const result = await loginAccount(input);
        if (result.ok) {
          updateDemo((current) => demoReducer(current, { type: "sign-in", session: result.session }));
        }
        return result;
      },
      signUp: async (input) => registerAccount(input),
      forgotPassword: async (input) => {
        await wait(450);
        return mockForgotPassword(input);
      },
      connect: (input) =>
        updateDemo((current) =>
          demoReducer(current, { type: "connect", input, at: new Date().toISOString() }),
        ),
      resetWorkspace: () => updateDemo((current) => demoReducer(current, { type: "reset-workspace" })),
    }),
    [state],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemoWorkspace = (): DemoWorkspaceValue => {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error("useDemoWorkspace must be used within DemoProvider");
  }
  return value;
};
