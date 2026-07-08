import { useEffect, useState } from 'react';
import { LiquidMetalButton } from './components/LiquidMetalButton';
import {
  Activity,
  BarChart3,
  FileBarChart,
  FileText,
  History,
  LogOut,
  Package,
  Radar,
  Receipt,
  ReceiptText,
  Settings as SettingsIcon,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import Background from './components/Background';
import Overview from './tabs/Overview';
import Analytics from './tabs/Analytics';
import Reports from './tabs/Reports';
import Pipeline from './tabs/Pipeline';
import TimelineTab from './tabs/Timeline';
import ListBuilder from './tabs/ListBuilder';
import Contractors from './tabs/Contractors';
import Dumpsters from './tabs/Dumpsters';
import Suppliers from './tabs/Suppliers';
import Estimates from './tabs/Estimates';
import Invoices from './tabs/Invoices';
import Expenses from './tabs/Expenses';
import Settings from './tabs/Settings';
import { checkSession, login, logout } from './lib/store';

const GROUPS = [
  {
    title: 'Operations',
    tabs: [
      { id: 'overview', label: 'Dashboard', Icon: BarChart3 },
      { id: 'analytics', label: 'Analytics', Icon: Activity },
      { id: 'reports', label: 'Reports', Icon: FileBarChart },
      { id: 'pipeline', label: 'Pipeline', Icon: TrendingUp },
      { id: 'timeline', label: 'Activity', Icon: History },
      { id: 'listbuilder', label: 'List Builder', Icon: Radar },
      { id: 'contractors', label: 'Contractors', Icon: Users },
      { id: 'dumpsters', label: 'Dumpsters', Icon: Trash2 },
      { id: 'suppliers', label: 'Suppliers', Icon: Package },
    ],
  },
  {
    title: 'Billing & CRM',
    tabs: [
      { id: 'estimates', label: 'Estimates', Icon: FileText },
      { id: 'invoices', label: 'Invoices', Icon: ReceiptText },
      { id: 'expenses', label: 'Expenses', Icon: Receipt },
    ],
  },
  {
    title: 'Administration',
    tabs: [{ id: 'settings', label: 'Settings', Icon: SettingsIcon }],
  },
] as const;

type TabId = (typeof GROUPS)[number]['tabs'][number]['id'];
type TabDef = { id: TabId; label: string; Icon: typeof BarChart3 };
const ALL_TABS = GROUPS.flatMap((g) => g.tabs as ReadonlyArray<TabDef>);

const LOGO = `${import.meta.env.BASE_URL}logo.png`;

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src={LOGO} alt="Paragon Exteriors" className="h-11 w-11 shrink-0 object-contain" />
      <div>
        <h1 className="font-display text-xl font-bold leading-tight text-white">Paragon</h1>
        <p className="text-xs text-white/50">Back Office</p>
      </div>
    </div>
  );
}

function Login({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Background />
      <form
        className="liquid-glass w-full max-w-sm rounded-3xl p-8 text-center"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const error = await login(pw);
          setBusy(false);
          if (error) setErr(error);
          else onOk();
        }}
      >
        <img src={LOGO} alt="Paragon Exteriors" className="mx-auto h-20 w-20 object-contain" />
        <h1 className="font-display mt-4 text-xl font-extrabold text-white">Paragon Back Office</h1>
        <p className="mt-1 text-sm text-white/55">Enter the admin password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(null); }}
          placeholder="Password"
          autoFocus
          className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-center text-sm text-white placeholder-white/35 focus:border-matrix-300/60 focus:outline-none"
        />
        {err && <p className="mt-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-200">{err}</p>}
        <div className="mt-4 flex justify-center">
          <LiquidMetalButton type="submit" width={220} disabled={busy || !pw} label={busy ? 'Checking…' : 'Sign in'} />
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  useEffect(() => {
    checkSession().then(setAuthed);
  }, []);

  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Background />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-matrix-300 border-t-transparent" />
      </div>
    );
  }

  if (!authed) return <Login onOk={() => setAuthed(true)} />;

  return (
    <div className="relative flex min-h-screen gap-6 p-4 lg:p-6">
      <Background />
      <aside className="liquid-glass sticky top-6 hidden h-fit w-60 shrink-0 flex-col rounded-3xl p-6 md:flex">
        <Logo />
        <nav className="mt-6 space-y-6">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-white/45">{g.title}</h4>
              <div className="space-y-1.5">
                {g.tabs.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left font-display text-sm font-semibold transition ${
                      tab === id
                        ? 'liquid-glass-inset text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={tab === id ? 'text-matrix-300' : ''} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button
          onClick={async () => { await logout(); window.location.reload(); }}
          className="mt-8 flex items-center gap-3 rounded-full px-4 py-2.5 text-left font-display text-sm font-semibold text-white/55 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      {/* phone nav */}
      <nav className="liquid-glass fixed inset-x-3 bottom-3 z-40 flex justify-between gap-1 overflow-x-auto rounded-full px-3 py-2 md:hidden">
        {ALL_TABS.map(({ id, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-label={id}
            className={`rounded-full p-2.5 ${tab === id ? 'liquid-glass-inset text-matrix-300' : 'text-white/60'}`}
          >
            <Icon size={18} />
          </button>
        ))}
        <button onClick={async () => { await logout(); window.location.reload(); }} aria-label="Sign out" className="rounded-full p-2.5 text-white/60">
          <LogOut size={18} />
        </button>
      </nav>

      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        {tab === 'overview' && <Overview />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'reports' && <Reports />}
        {tab === 'pipeline' && <Pipeline />}
        {tab === 'timeline' && <TimelineTab />}
        {tab === 'listbuilder' && <ListBuilder />}
        {tab === 'contractors' && <Contractors />}
        {tab === 'dumpsters' && <Dumpsters />}
        {tab === 'suppliers' && <Suppliers />}
        {tab === 'estimates' && <Estimates />}
        {tab === 'invoices' && <Invoices />}
        {tab === 'expenses' && <Expenses />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
