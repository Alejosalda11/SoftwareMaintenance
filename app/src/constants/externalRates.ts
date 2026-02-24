// Sydney NSW 2026 reference hourly rates (AUD) for external trades
import type { DamageCategory, ExternalRates } from '@/types';

const CATEGORIES: DamageCategory[] = [
  'plumbing',
  'electrical',
  'furniture',
  'appliances',
  'structural',
  'hvac',
  'painting',
  'cleaning',
  'other',
];

export const DEFAULT_EXTERNAL_RATES_SYDNEY_2026: ExternalRates = {
  plumbing: 105,
  electrical: 110,
  furniture: 85,
  appliances: 95,
  structural: 100,
  hvac: 100,
  painting: 65,
  cleaning: 55,
  other: 80,
};

export function getDefaultExternalRates(): ExternalRates {
  return { ...DEFAULT_EXTERNAL_RATES_SYDNEY_2026 };
}

export function getAllCategories(): DamageCategory[] {
  return [...CATEGORIES];
}
