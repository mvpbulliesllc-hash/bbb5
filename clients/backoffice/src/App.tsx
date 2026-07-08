import { useEffect, useState } from 'react';
import Overview from './tabs/Overview';
import Pipeline from './tabs/Pipeline';
import Contractors from './tabs/Contractors';
import Dumpsters from './tabs/Dumpsters';
import Suppliers from './tabs/Suppliers';
import Expenses from './tabs/Expenses';
import Settings from './tabs/Settings';
import { checkSession, login, logout } from './lib/store';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-12h8V3h-8v6Z" /> },
  { id: 'pipeline', label: 'Pipeline', icon: <path d="M4 5h16v3H4V5Zm2 5.5h12v3H6v-3ZM8 16h8v3H8v-3Z" /> },
  { id: 'contractors', label: 'Contractors', icon: <path d="M12 2a5 5 0 0 1 5 5v1h1a1 1 0 1 1 0 2h-1.1A5 5 0 0 1 7.1 10H6a1 1 0 1 1 0-2h1V7a5 5 0 0 1 5-5Zm-8 18a8 8 0 0 1 16 0v2H4v-2Z" /> },
  { id: 'dumpsters', label: 'Dumpsters', icon: <path d="M3 8h18l-1.5 12a2 2 0 0 1-2 1.8h-11A2 2 0 0 1 4.5 20L3 8Zm5-4h8l1 3H7l1-3Z" /> },
  { id: 'suppliers', label: 'Suppliers', icon: <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Zm9-1.8L6.2 7.6 12 10l5.8-2.4L12 5.2ZM5 9.4l6 2.5v6.9l-6-2.6V9.4Zm14 0v6.8l-6 2.6v-6.9l6-2.5Z" /> },
  { id: 'expenses', label: 'Expenses', icon: <path d="M4 4h16v4H4V4Zm0 6h16v10H4V10Zm4 3v2h8v-2H8Z" /> },
  { id: 'settings', label: 'Settings', icon: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.9 4a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L16 3h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2L12 21h4l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z" /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

function Login({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center bg-navy-950 px-4">
      <form
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const error = await login(pw);
          setBusy(false);
          if (error) setErr(error);
          else onOk();
        }}
      >
        <img src="favicon.png" alt="" className="mx-auto h-14 w-14" />
        <h1 className="font-display mt-4 text-xl font-extrabold text-navy-950">Paragon Back Office</h1>
        <p className="mt-1 text-sm text-navy-900/60">Enter the admin password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(null); }}
          placeholder="Password"
          autoFocus
          className="mt-5 w-full rounded-xl border border-sand-200 px-4 py-2.5 text-center text-sm focus:border-gold-500 focus:outline-none"
        />
        {err && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{err}</p>}
        <button
          disabled={busy || !pw}
          className="mt-4 w-full rounded-xl bg-gold-500 px-4 py-2.5 font-display font-bold text-navy-950 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>
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
      <div className="grid min-h-screen place-items-center bg-navy-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
      </div>
    );
  }

  if (!authed) return <Login onOk={() => setAuthed(true)} />;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col bg-navy-950 text-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img src="favicon.png" alt="" className="h-9 w-9" />
          <div className="font-display leading-tight">
            <p className="text-sm font-extrabold tracking-wide">PARAGON</p>
            <p className="text-[0.6rem] font-semibold tracking-[0.25em] text-gold-300">BACK OFFICE</p>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-display text-sm font-semibold transition ${
                tab === t.id ? 'bg-white/10 text-gold-300' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{t.icon}</svg>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <button
            onClick={async () => { await logout(); window.location.reload(); }}
            className="text-xs font-semibold text-gold-300 hover:text-gold-200"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        {tab === 'overview' && <Overview />}
        {tab === 'pipeline' && <Pipeline />}
        {tab === 'contractors' && <Contractors />}
        {tab === 'dumpsters' && <Dumpsters />}
        {tab === 'suppliers' && <Suppliers />}
        {tab === 'expenses' && <Expenses />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
