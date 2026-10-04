import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureSeeded } from '@/lib/seed';
import type { Report } from '@/lib/types';
import Sidebar, { type PageId } from '@/components/Sidebar';
import Overview from '@/pages/Overview';
import Analyze from '@/pages/Analyze';
import SifReports from '@/pages/SifReports';
import PrecursorPatterns from '@/pages/PrecursorPatterns';
import LifeSavingRules from '@/pages/LifeSavingRules';
import About from '@/pages/About';

function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedError, setSeedError] = useState(false);

  async function loadReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load reports:', error);
      return;
    }
    setReports((data as Report[]) || []);
  }

  useEffect(() => {
    (async () => {
      await ensureSeeded();
      await loadReports();
      setLoading(false);
    })();
  }, []);

  const handleNavigate = (p: PageId) => {
    setPage(p);
  };

  const handleDataChange = async () => {
    await loadReports();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-panel)]">
        <div className="text-center">
          <div className="animate-pulse-loading text-[var(--color-primary)] text-lg font-semibold">
            Initializing DrishtiSIF...
          </div>
          <div className="text-[var(--color-text-light)] text-sm mt-2">
            Loading safety intelligence platform
          </div>
        </div>
      </div>
    );
  }

  if (seedError || reports.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-panel)]">
        <div className="text-center max-w-md">
          <div className="text-[var(--color-high)] text-lg font-semibold mb-2">
            Unable to load data
          </div>
          <div className="text-[var(--color-text-light)] text-sm">
            There was a problem loading the report data. Please try refreshing the page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-panel)]">
      <Sidebar currentPage={page} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-x-auto">
        {page === 'overview' && <Overview reports={reports} onNavigate={handleNavigate} />}
        {page === 'analyze' && <Analyze reports={reports} onSaved={handleDataChange} onNavigate={handleNavigate} />}
        {page === 'reports' && <SifReports reports={reports} onStatusChange={handleDataChange} />}
        {page === 'patterns' && <PrecursorPatterns reports={reports} />}
        {page === 'rules' && <LifeSavingRules reports={reports} onNavigate={handleNavigate} />}
        {page === 'about' && <About />}
      </main>
    </div>
  );
}

export default App;
