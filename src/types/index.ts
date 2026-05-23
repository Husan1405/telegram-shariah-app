/**
 * Shared types used across the Mini App.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'TRY' | 'RUB' | 'AED';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
}

/* ---------------- Zakat ---------------- */

export interface ZakatInput {
  cash: number;
  bank: number;
  gold: number; // grams
  silver: number; // grams
  crypto: number;
  investments: number;
  trade: number;
  debts: number;
}

export interface ZakatResult {
  totalAssets: number;
  zakatableAmount: number;
  nisabAmount: number;
  zakatDue: number;
  isObliged: boolean;
}

/* ---------------- Inheritance ---------------- */

export type HeirKey =
  | 'husband'
  | 'wife'
  | 'sons'
  | 'daughters'
  | 'father'
  | 'mother'
  | 'grandfather'
  | 'grandmother'
  | 'brothers'
  | 'sisters';

export interface HeirsState {
  husband: 0 | 1;
  wife: number; // 0..4
  sons: number;
  daughters: number;
  father: 0 | 1;
  mother: 0 | 1;
  grandfather: 0 | 1;
  grandmother: 0 | 1;
  brothers: number;
  sisters: number;
}

export interface InheritanceInput {
  total: number;
  debts: number;
  bequest: number; // up to 1/3 of (total - debts)
  heirs: HeirsState;
}

export interface HeirShare {
  key: HeirKey;
  label: string;
  count: number;
  /** Total fraction of the net estate that goes to this group. */
  fraction: number;
  /** Money amount that goes to the whole group. */
  amount: number;
  /** Money amount per individual heir in the group. */
  perPerson: number;
  reason: string;
}

export interface InheritanceResult {
  netEstate: number;
  bequestAmount: number;
  distributable: number;
  shares: HeirShare[];
  warnings: string[];
  /** True when the case requires a scholar (e.g. Awl / Radd / Kalala). */
  needsScholar: boolean;
}
