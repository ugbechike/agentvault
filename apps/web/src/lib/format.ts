const dateTime = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatTimestamp = (iso: string): string => dateTime.format(new Date(iso));

export const formatDuration = (ms: number): string =>
  ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

export const apiBaseUrl = (): string => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
