// Optional platform capabilities. When the page runs as a claude.ai artifact these light up;
// anywhere else (a downloaded copy, a Vercel deploy) the page falls back to plain browser behavior.

/** False in this file. Offline builds swap in claude.offline.ts, which has no AI or platform code at all. */
export const OFFLINE: boolean = false;

type Use = (name: string) => Promise<any>;
const host = () => {
  if (OFFLINE) return null;
  const c = (window as any).claude;
  return c && typeof c.use === "function" ? (c.use.bind(c) as Use) : null;
};

const cache: Record<string, Promise<any>> = {};
export function capability(name: "downloads" | "sample"): Promise<any> {
  if (OFFLINE) return Promise.resolve(null);
  if (!cache[name]) {
    cache[name] = (async () => {
      // window.claude can arrive a moment after first paint
      for (let i = 0; i < 20 && !host(); i++) await new Promise((r) => setTimeout(r, 150));
      const use = host();
      if (!use) return null;
      try {
        return await use(name);
      } catch {
        return null;
      }
    })();
  }
  return cache[name];
}
export const inClaude = () => !!host();

export type SaveOutcome = "saved" | "declined" | "busy" | "fallback" | "failed";

export async function saveFile(filename: string, data: Blob): Promise<SaveOutcome> {
  const dl = await capability("downloads");
  if (dl) {
    try {
      await dl.save({ filename, data });
      return "saved";
    } catch (e: any) {
      if (e?.code === "declined") return "declined";
      if (e?.code === "rate_limited") return "busy";
      // fall through to a plain download
    }
  }
  try {
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return "fallback";
  } catch {
    return "failed";
  }
}

export interface BrandGuess {
  company_name?: string;
  primary?: string;
  accent?: string;
  secondary?: string | null;
  confidence?: "high" | "medium" | "low";
  notes?: string;
}

export async function askBrand(company: string, website: string): Promise<BrandGuess> {
  if (OFFLINE) throw new Error("unavailable");
  return askBrandOnline(company, website);
}

async function askBrandOnline(company: string, website: string): Promise<BrandGuess> {
  if (OFFLINE) throw new Error("unavailable");
  const sample = await capability("sample");
  if (!sample) throw new Error("unavailable");
  const prompt = `You help set up a branded insurance loss dashboard for a restaurant company. Identify the company's official brand colors.
Company name: ${company || "(not given)"}
Website: ${website || "(not given)"}

Return ONLY a JSON object with these keys:
{"company_name": string, "primary": "#RRGGBB", "accent": "#RRGGBB", "secondary": "#RRGGBB" or null, "confidence": "high" | "medium" | "low", "notes": "one short sentence on where these colors come from"}

Use the colors of the company's logo and website as you know them. Primary is the dominant brand color, accent the strongest second color. If you don't recognize this company, pick tasteful colors that suit a restaurant brand, set confidence to "low" and say so in notes. Do not include a logo or any URL.`;
  let val: any;
  try {
    val = await sample.json(prompt, { modelTier: "quick" });
  } catch (e: any) {
    if (e?.code === "not_granted" || e?.code === "rate_limited") throw e;
    const res = await sample(prompt, { modelTier: "quick" });
    const m = String(res?.text ?? "").match(/\{[\s\S]*\}/);
    val = m ? JSON.parse(m[0]) : null;
  }
  if (!val || typeof val !== "object") throw new Error("No colors came back. Try again or pick them by hand.");
  return val as BrandGuess;
}
