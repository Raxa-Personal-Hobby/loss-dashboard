import { Check, ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import type { Coverage, Filters } from "@/lib/types";
import { EMPTY_FILTERS } from "@/lib/types";
import { coverageLabel, coverageShort, type Industry } from "@/lib/industries";
import { Seg } from "./kit";
import { num } from "@/lib/metrics";

const btn =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#d8dce1] bg-white px-3 text-[12.5px] font-semibold text-[#1c2126] transition hover:border-[#b7bcc4]";

function MultiSelect({ label, all, options, value, onChange }: { label: string; all: string; options: { value: string; count: number }[]; value: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(value);
  const text = value.length === 0 ? all : value.length === 1 ? value[0] : `${value.length} ${label}`;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={`${btn} max-w-[220px] ${value.length ? "border-[color:var(--brand)] bg-[color:var(--brand-tint)]" : ""}`}>
          <span className="truncate">{text}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#5d6570]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label}`} />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.value} onSelect={() => onChange(set.has(o.value) ? value.filter((v) => v !== o.value) : [...value, o.value])}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${set.has(o.value) ? "border-[color:var(--brand-deep)] bg-[color:var(--brand-deep)] text-white" : "border-[#cdd1d7]"}`}>
                    {set.has(o.value) && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{o.value}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-[#8b929b]">{num(o.count)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {value.length > 0 && (
            <button type="button" className="w-full border-t px-3 py-2 text-left text-[12.5px] font-semibold text-[#5d6570] hover:text-[#1c2126]" onClick={() => onChange([])}>
              Clear selection
            </button>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function YearSelect({ value, years, onChange, placeholder }: { value: number | null; years: number[]; onChange: (v: number | null) => void; placeholder: string }) {
  return (
    <label className={`${btn} relative pr-7`}>
      <span className="sr-only">{placeholder}</span>
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <span>{value ?? placeholder}</span>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#5d6570]" />
    </label>
  );
}

export interface FilterOptions {
  years: number[];
  locations: { value: string; count: number }[];
  regions: { value: string; count: number }[];
  categories: { value: string; count: number }[];
  coverages: Coverage[];
}

export function FilterBar({ f, set, opts, shown, total, ind }: { f: Filters; set: (f: Filters) => void; opts: FilterOptions; shown: number; total: number; ind: Industry }) {
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS);
  const toggleCov = (c: Coverage) => set({ ...f, coverages: f.coverages.includes(c) ? f.coverages.filter((x) => x !== c) : [...f.coverages, c] });
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] lg:flex-wrap lg:overflow-visible">
      <span className="hidden shrink-0 items-center gap-1 pr-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#5d6570] sm:inline-flex">
        <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <YearSelect value={f.yearFrom} years={opts.years} onChange={(v) => set({ ...f, yearFrom: v })} placeholder="From" />
        <span className="text-[12px] text-[#8b929b]">to</span>
        <YearSelect value={f.yearTo} years={opts.years} onChange={(v) => set({ ...f, yearTo: v })} placeholder="To" />
      </div>
      <MultiSelect label={ind.unit.many} all={`All ${ind.unit.many}`} options={opts.locations} value={f.locations} onChange={(v) => set({ ...f, locations: v })} />
      {opts.regions.length > 1 && <MultiSelect label="regions" all="All regions" options={opts.regions} value={f.regions} onChange={(v) => set({ ...f, regions: v })} />}
      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#eceef1] p-0.5" role="group" aria-label="Line of coverage">
        {opts.coverages.map((c) => {
          const on = f.coverages.includes(c);
          return (
            <button
              key={c}
              type="button"
              title={coverageLabel(ind, c)}
              aria-pressed={on}
              onClick={() => toggleCov(c)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${on ? "bg-[color:var(--brand-deep)] text-white" : "text-[#3c434c] hover:bg-white"}`}
            >
              {coverageShort(ind, c)}
            </button>
          );
        })}
      </div>
      <MultiSelect label="causes" all="All causes" options={opts.categories} value={f.categories} onChange={(v) => set({ ...f, categories: v })} />
      <div className="shrink-0">
        <Seg
          small
          value={f.status}
          onChange={(v) => set({ ...f, status: v })}
          options={[
            { value: "all", label: "All" },
            { value: "Open", label: "Open" },
            { value: "Closed", label: "Closed" },
          ]}
        />
      </div>
      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-[#3c434c]">
        <Switch checked={f.litigatedOnly} onCheckedChange={(v) => set({ ...f, litigatedOnly: v })} />
        Litigated
      </label>
      {active && (
        <button type="button" onClick={() => set(EMPTY_FILTERS)} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-[#5d6570] hover:text-[#1c2126]">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      )}
      <span className="ml-auto shrink-0 pl-2 text-[12px] tabular-nums text-[#5d6570]">
        {num(shown)} of {num(total)} claims
      </span>
    </div>
  );
}
