"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** True only after the browser snapshot is active, so localStorage is safe to trust. */
export const useIsClient = (): boolean =>
  useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
