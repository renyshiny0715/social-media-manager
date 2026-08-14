// Scheduling helper: "tonight at 10pm UK time".
// Europe/London flips between UTC+0 (GMT) and UTC+1 (BST), so the wall-clock
// target is converted to UTC by checking which candidate renders as 22:00 London.

const PUBLISH_HOUR_LONDON = 22;

function londonWallTimeToUtc(ymd: string, hour: number): Date {
  for (const offset of [1, 0]) {
    const candidate = new Date(`${ymd}T${String(hour - offset).padStart(2, "0")}:00:00Z`);
    const rendered = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(candidate);
    if (Number(rendered) === hour) return candidate;
  }
  return new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00Z`);
}

// Next occurrence of 22:00 Europe/London strictly in the future.
export function nextLondonPublishTime(now: Date = new Date()): Date {
  for (let addDays = 0; addDays < 3; addDays++) {
    const day = new Date(now.getTime() + addDays * 86_400_000);
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(day);
    const target = londonWallTimeToUtc(ymd, PUBLISH_HOUR_LONDON);
    if (target.getTime() > now.getTime()) return target;
  }
  throw new Error("could not compute next publish time");
}

export function formatLondon(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}
