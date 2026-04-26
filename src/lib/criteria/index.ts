import yamaguchi from "./yamaguchi-aosd.json";
import iim from "./eular-acr-iim-2017.json";
import sle from "./acr-eular-sle-2019.json";
import ra from "./acr-eular-ra-2010.json";
import aav from "./acr-eular-aav-2022.json";
import igg4 from "./acr-eular-igg4rd-2019.json";
import sjogren from "./acr-eular-sjogren-2016.json";
import type { CitedReference } from "@/lib/diagnostics/types";

export type CriteriaReference = CitedReference & {
  type?: string;
  also_published?: string;
  verify_pending?: boolean;
};

type LooseCriterion = {
  id?: string;
  label?: string;
};

export type CriteriaFile = {
  id: string;
  name: string;
  citation?: string;
  classification_rule?: string;
  major?: LooseCriterion[];
  minor?: LooseCriterion[];
  exclusions?: LooseCriterion[];
  // Two valid shapes in the wild:
  //   array form:  [{ name, criteria: [...] }, ...]
  //   object form: { joint_involvement: [...], serology: [...], ... }
  domains?:
    | Array<{ name?: string; criteria?: LooseCriterion[] }>
    | Record<string, LooseCriterion[]>;
  criteria?: LooseCriterion[];
  references?: CriteriaReference[];
};

export const CRITERIA: CriteriaFile[] = [
  yamaguchi as unknown as CriteriaFile,
  iim as unknown as CriteriaFile,
  sle as unknown as CriteriaFile,
  ra as unknown as CriteriaFile,
  aav as unknown as CriteriaFile,
  igg4 as unknown as CriteriaFile,
  sjogren as unknown as CriteriaFile,
];

export function findCriteria(id: string): CriteriaFile | undefined {
  return CRITERIA.find((c) => c.id === id);
}

export function topReferences(c: CriteriaFile, n = 3): CriteriaReference[] {
  return (c.references ?? []).slice(0, n);
}

export function flatCriterionList(c: CriteriaFile): LooseCriterion[] {
  const list: LooseCriterion[] = [];
  if (c.major) list.push(...c.major);
  if (c.minor) list.push(...c.minor);
  if (c.criteria) list.push(...c.criteria);
  if (c.domains) {
    const arr: Array<{ name?: string; criteria?: LooseCriterion[] }> = Array.isArray(c.domains)
      ? c.domains
      : Object.entries(c.domains as Record<string, unknown>).map(([name, value]) => ({
          name,
          criteria: Array.isArray(value) ? (value as LooseCriterion[]) : [],
        }));
    for (const d of arr) {
      if (d.criteria) list.push(...d.criteria);
    }
  }
  return list.filter((x) => x?.id && x?.label);
}
