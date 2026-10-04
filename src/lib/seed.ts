import { supabase } from './supabase';
import { generateSeedReports } from './seedData';

const SEED_FLAG_KEY = 'drishtisif_seeded_v1';

export async function ensureSeeded(): Promise<void> {
  const alreadySeeded = localStorage.getItem(SEED_FLAG_KEY);
  if (alreadySeeded) return;

  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    localStorage.setItem(SEED_FLAG_KEY, '1');
    return;
  }

  const seedReports = generateSeedReports();
  const { error } = await supabase.from('reports').insert(seedReports);

  if (!error) {
    localStorage.setItem(SEED_FLAG_KEY, '1');
  }
}

export async function resetAndReseed(): Promise<void> {
  await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  localStorage.removeItem(SEED_FLAG_KEY);
  await ensureSeeded();
}

export function getNextReportId(existingCount: number): string {
  const num = existingCount + 1;
  return `RPT-${String(num).padStart(4, '0')}`;
}
