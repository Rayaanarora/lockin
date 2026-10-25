import { Mission } from "../app/types";

export function getGoogleCalendarUrl(mission: Mission): string {
  const title = encodeURIComponent(mission.title);
  const details = encodeURIComponent(
    `${mission.description || ""}${mission.secret_info ? `\n\nAccess Details: ${mission.secret_info}` : ""}\n\nOrganized on LOCKIN.`
  );
  const location = encodeURIComponent(mission.location || "Campus");

  let datesParam = "";
  if (mission.datetime) {
    const startDate = new Date(mission.datetime);
    const durationMin = mission.focus_duration || 60;
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    const formatGCal = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    datesParam = `&dates=${formatGCal(startDate)}/${formatGCal(endDate)}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${datesParam}&details=${details}&location=${location}`;
}

export function downloadICS(mission: Mission): void {
  if (typeof window === "undefined") return;

  const title = (mission.title || "LOCKIN Mission").replace(/\r?\n/g, " ");
  const description = ((mission.description || "") + (mission.secret_info ? `\\n\\nAccess: ${mission.secret_info}` : "")).replace(/\r?\n/g, "\\n");
  const location = (mission.location || "Campus").replace(/\r?\n/g, " ");

  const startDate = mission.datetime ? new Date(mission.datetime) : new Date();
  const durationMin = mission.focus_duration || 60;
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

  const formatICS = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LOCKIN//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:lockin-event-${mission.id}@lockin.top`,
    `DTSTAMP:${formatICS(new Date())}`,
    `DTSTART:${formatICS(startDate)}`,
    `DTEND:${formatICS(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${(mission.title || "mission").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
