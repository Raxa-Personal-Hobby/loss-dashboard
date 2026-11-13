// Offline edition of claude.ts. bundle.sh swaps this file in when LOSS_OFFLINE=1.
// It contains no AI calls and no platform hooks: saving files is a plain browser download.

export const OFFLINE: boolean = true;

export function capability(_name: "downloads" | "sample"): Promise<null> {
  return Promise.resolve(null);
}
export const inClaude = () => false;

export type SaveOutcome = "saved" | "declined" | "busy" | "fallback" | "failed";

export async function saveFile(filename: string, data: Blob): Promise<SaveOutcome> {
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

export async function askBrand(_company: string, _website: string): Promise<BrandGuess> {
  throw new Error("unavailable");
}
