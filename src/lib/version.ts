// The app version and the notes shown in the "What's new" window. Newest first.
export const APP_VERSION = "1.2.1";

export interface ReleaseNote {
  version: string;
  date: string;
  items: { tag: "New" | "Improved" | "Fixed"; text: string }[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.2.1",
    date: "November 2026",
    items: [
      { tag: "New", text: "One Upload source data window for both the loss run and a safety report, with blank templates and samples for each." },
      { tag: "New", text: "Your industry and NAICS code are shown in the left sidebar. Click it to change." },
      { tag: "New", text: "An Export reports section at the bottom of the page: PowerPoint or Google Slides, PNG and Excel." },
      { tag: "Improved", text: "Reads OSHA's injury tracking (ITA) case CSV and OSHA 300 logs typed into Excel with check marks." },
      { tag: "Fixed", text: "A safety report whose OSHA columns can't be read now stops with a message, instead of counting zero recordables." },
      { tag: "Improved", text: "Sample companies are now named Acme." },
    ],
  },
  {
    version: "1.2.0",
    date: "November 2026",
    items: [
      { tag: "New", text: "Combine a safety report (OSHA 300 log or your own sheet) with the loss run. Locations are matched for you, and you confirm every pair." },
      { tag: "New", text: "Findings that compare both reports, such as far fewer OSHA recordables than paid comp claims." },
    ],
  },
];

const cmp = (a: string, b: string) => {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};

/** Notes newer than the version this browser last saw. No record means the last one seen was before notes existed. */
export const notesSince = (seen: string | null) => RELEASE_NOTES.filter((n) => !seen || cmp(n.version, seen) > 0);
