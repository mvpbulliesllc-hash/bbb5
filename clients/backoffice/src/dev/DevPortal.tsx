import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  type CatalogEntry,
  type EnvVarEntry,
  type VaultCategory,
  catalogFile,
  formatBytes,
  loadCatalog,
  loadEnvVault,
  saveCatalog,
  saveEnvVault,
} from './vault';

/**
 * Dev portal — a v0-style, full-screen three-panel workspace.
 *
 *  ┌──────────┬──────────────┬───────────────────────────────┐
 *  │ Tool shed│  Agent (Dev) │  Preview "browser"            │
 *  │ + nav    │  chat/tasks  │                               │
 *  └──────────┴──────────────┴───────────────────────────────┘
 *
 *  - Tool shed: collapsible. Default 20% wide, expandable to 30%,
 *    or fully closed. App navigation lives here too.
 *  - Agent panel: never collapses, never below 10%.
 *  - Preview: takes the remainder — up to 90% when the shed is
 *    closed and the chat is pushed to its 10% floor.
 *
 * Everything here is client-side: the upload catalog and env vault
 * persist to localStorage, agent replies are simulated until the Dev
 * backend is wired in, and branch/PR actions are logged into the
 * transcript as intents.
 */

interface NavTab {
  id: string;
  label: string;
}

interface Props {
  tabs: readonly NavTab[];
  activeTab: string;
  onNavigate: (id: string) => void;
  onExit: () => void;
  userEmail?: string;
}

type Role = 'user' | 'dev' | 'system';
interface Msg {
  id: string;
  role: Role;
  text: string;
  at: string;
  files?: CatalogEntry[];
}

type ShedState = 'closed' | 'normal' | 'wide';
type ShedTab = 'nav' | 'files' | 'env' | 'repo';

const SHED_WIDTH: Record<ShedState, number> = { closed: 0, normal: 20, wide: 30 };
const CHAT_MIN = 10;
const CHAT_MAX = 55;

const CATEGORIES: { id: VaultCategory; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'priority', label: 'Top priority' },
  { id: 'components', label: 'Component library' },
  { id: 'design', label: 'Design system' },
  { id: 'media', label: 'Media' },
  { id: 'docs', label: 'Docs' },
];

const REPOS = ['mvpbulliesllc-hash/bbb5', 'fullstackhero/docs'];

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

export default function DevPortal({ tabs, activeTab, onNavigate, onExit, userEmail }: Props) {
  // ---- layout -------------------------------------------------------------
  const [shed, setShed] = useState<ShedState>('normal');
  const [shedTab, setShedTab] = useState<ShedTab>('nav');
  const [chatPct, setChatPct] = useState(30);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const shedPct = SHED_WIDTH[shed];
  const chatEff = Math.min(Math.max(chatPct, CHAT_MIN), CHAT_MAX);

  const onDividerDown = useCallback(() => {
    dragging.current = true;
    const move = (e: PointerEvent) => {
      if (!dragging.current || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const pct = (((e.clientX - rect.left) / rect.width) * 100 - shedPct) as number;
      setChatPct(Math.min(Math.max(pct, CHAT_MIN), CHAT_MAX));
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [shedPct]);

  // ---- vault / catalog ----------------------------------------------------
  const [catalog, setCatalog] = useState<CatalogEntry[]>(loadCatalog);
  const [envVault, setEnvVault] = useState<EnvVarEntry[]>(loadEnvVault);
  useEffect(() => saveCatalog(catalog), [catalog]);
  useEffect(() => saveEnvVault(envVault), [envVault]);

  // ---- chat ---------------------------------------------------------------
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: 'dev',
      at: now(),
      text: "Dev here. Drop files, paste secrets, or describe the build — I'll catalog, plan, and ship it. What are we making perfect today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<CatalogEntry[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const post = useCallback(
    (role: Role, text: string, files?: CatalogEntry[]) => {
      setMessages((m) => [...m, { id: uid(), role, text, at: now(), files }]);
      if (role === 'dev' && voiceOut && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    },
    [voiceOut],
  );

  const devReply = useCallback(
    (userText: string, files: CatalogEntry[]) => {
      // Simulated Dev turn until the agent backend is connected.
      window.setTimeout(() => {
        if (files.length) {
          const names = files.map((f) => f.systemName).join(', ');
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: 'dev',
              at: now(),
              text: `Cataloged ${files.length} file${files.length > 1 ? 's' : ''} → ${names}. Filed under Inbox. Does anything here need special handling — the vault, top priority, or the component library?`,
            },
          ]);
          return;
        }
        const lower = userText.toLowerCase();
        const text = lower.includes('pr')
          ? 'On it — branch cut, work queued in micro-tasks with QC gates between each. I will surface the PR for your approval before anything merges.'
          : lower.includes('env') || lower.includes('secret') || lower.includes('key')
            ? 'Secret received pattern noted — add it in the Env vault tab (tool shed → Env) and I will fold it into the run manifest.'
            : `Understood: "${userText}". Drafting the stack and build plan — I'll present it for approval, then run sequenced micro-tasks with QC, test, and review at every checkpoint.`;
        setMessages((m) => [...m, { id: uid(), role: 'dev', at: now(), text }]);
      }, 600);
    },
    [],
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text && !pending.length) return;
    post('user', text || '(files)', pending.length ? pending : undefined);
    setInput('');
    setPending([]);
    devReply(text, pending);
  }, [input, pending, post, devReply]);

  const ingestFiles = useCallback((list: FileList | File[]) => {
    setCatalog((prev) => {
      const added: CatalogEntry[] = [];
      let next = prev;
      for (const f of Array.from(list)) {
        const entry = catalogFile(f, next);
        next = [entry, ...next];
        added.push(entry);
      }
      setPending((p) => [...p, ...added]);
      return next;
    });
  }, []);

  const toggleMic = useCallback(() => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!Ctor) {
      post('system', 'Voice input is not supported in this browser.');
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).slice(e.resultIndex).map((r) => r[0].transcript).join(' ');
      setInput((v) => (v ? v + ' ' : '') + t.trim());
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, post]);

  // ---- preview ------------------------------------------------------------
  const [repo, setRepo] = useState(REPOS[0]);
  const [branch, setBranch] = useState('main');
  const [previewUrl, setPreviewUrl] = useState('http://localhost:5173/');
  const [urlDraft, setUrlDraft] = useState(previewUrl);
  const [frameKey, setFrameKey] = useState(0);
  const [device, setDevice] = useState<'full' | 'tablet' | 'phone'>('full');
  const previewRef = useRef<HTMLDivElement>(null);

  const goFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void previewRef.current?.requestFullscreen();
  };

  const action = (label: string) =>
    post('system', `${label} → queued on ${repo}@${branch}. Dev will confirm in the transcript when it lands.`);

  const previewPct = 100 - shedPct - chatEff;

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 flex bg-navy-950 font-display text-white">
      {/* ── Tool shed (collapsible nav + dev tools) ─────────────────────── */}
      {shed !== 'closed' && (
        <aside
          style={{ width: `${shedPct}%` }}
          className="flex min-w-0 shrink-0 flex-col border-r border-white/10 bg-navy-950"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="" className="h-7 w-7" />
              <span className="text-sm font-extrabold tracking-wide">
                DEV<span className="text-gold-300"> PORTAL</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn title={shed === 'wide' ? 'Shrink to 20%' : 'Expand to 30%'} onClick={() => setShed(shed === 'wide' ? 'normal' : 'wide')}>
                {shed === 'wide' ? '⇤' : '⇥'}
              </IconBtn>
              <IconBtn title="Close panel" onClick={() => setShed('closed')}>✕</IconBtn>
            </div>
          </div>

          <div className="flex gap-1 px-3">
            {(
              [
                ['nav', 'Nav'],
                ['files', 'Files'],
                ['env', 'Env'],
                ['repo', 'Repo'],
              ] as [ShedTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setShedTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  shedTab === id ? 'bg-white/10 text-gold-300' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {shedTab === 'nav' && (
              <nav className="space-y-1">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onNavigate(t.id);
                      onExit();
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                      activeTab === t.id ? 'bg-white/10 text-gold-300' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/50">
                  <p className="truncate">{userEmail}</p>
                  <button onClick={onExit} className="mt-1 font-semibold text-gold-300 hover:text-gold-200">
                    ← Back office
                  </button>
                </div>
              </nav>
            )}
            {shedTab === 'files' && (
              <FileVault catalog={catalog} setCatalog={setCatalog} onAttach={(e) => setPending((p) => [...p, e])} />
            )}
            {shedTab === 'env' && <EnvVault vault={envVault} setVault={setEnvVault} />}
            {shedTab === 'repo' && (
              <div className="space-y-3 text-sm">
                <label className="block text-xs font-semibold text-white/50">Repository</label>
                <select
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-navy-900 px-2 py-1.5 text-sm"
                >
                  {REPOS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <label className="block text-xs font-semibold text-white/50">Branch</label>
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-navy-900 px-2 py-1.5 text-sm"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <ShedAction onClick={() => action('Create branch')}>＋ Branch</ShedAction>
                  <ShedAction onClick={() => action('Open PR')}>Open PR</ShedAction>
                  <ShedAction onClick={() => action('Merge PR')}>Merge PR</ShedAction>
                  <ShedAction onClick={() => action('Sync integrations')}>Integrations</ShedAction>
                </div>
                <p className="pt-2 text-xs leading-relaxed text-white/40">
                  Actions are queued as intents in the transcript; Dev executes them once the agent backend is
                  connected.
                </p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── Agent panel (never collapses, min 10%) ──────────────────────── */}
      <section
        style={{ width: `${chatEff}%`, minWidth: '10%' }}
        className="relative flex min-w-0 flex-col border-r border-white/10 bg-navy-900"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) ingestFiles(e.dataTransfer.files);
        }}
      >
        <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          {shed === 'closed' && (
            <IconBtn title="Open tool shed" onClick={() => setShed('normal')}>☰</IconBtn>
          )}
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-bold">Dev</span>
          <span className="text-xs text-white/40">fable-5 · adjustable effort</span>
          <div className="ml-auto flex items-center gap-1">
            <IconBtn title={voiceOut ? 'Mute Dev voice' : 'Dev speaks replies'} onClick={() => setVoiceOut((v) => !v)}>
              {voiceOut ? '🔊' : '🔇'}
            </IconBtn>
          </div>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gold-500 text-navy-950'
                    : m.role === 'system'
                      ? 'bg-white/5 text-white/60 italic'
                      : 'bg-navy-800 text-white'
                }`}
              >
                {m.text}
                {m.files && (
                  <ul className="mt-1.5 space-y-0.5 border-t border-black/10 pt-1.5 text-xs opacity-80">
                    {m.files.map((f) => (
                      <li key={f.id} className="truncate font-mono">📎 {f.systemName}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2">
            {pending.map((f) => (
              <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                <span className="max-w-40 truncate font-mono">{f.systemName}</span>
                <button onClick={() => setPending((p) => p.filter((x) => x.id !== f.id))} className="text-white/50 hover:text-white">✕</button>
              </span>
            ))}
          </div>
        )}

        <footer className="border-t border-white/10 p-2.5">
          <div className="flex items-end gap-1.5">
            <label className="cursor-pointer rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white" title="Upload files">
              📎
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) ingestFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              onClick={toggleMic}
              title={listening ? 'Stop dictation' : 'Talk to Dev'}
              className={`rounded-lg p-2 transition ${listening ? 'bg-red-500/80 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              🎙
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Prompt Dev — or drop files anywhere in this panel…"
              className="max-h-40 min-h-10 flex-1 resize-y rounded-xl border border-white/10 bg-navy-950 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-gold-400/60"
            />
            <button
              onClick={send}
              className="rounded-xl bg-gold-500 px-3.5 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-400"
            >
              ↑
            </button>
          </div>
        </footer>

        {/* drag handle between chat and preview */}
        <div
          onPointerDown={onDividerDown}
          className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize hover:bg-gold-400/40"
          title="Drag to resize"
        />
      </section>

      {/* ── Preview "browser" ───────────────────────────────────────────── */}
      <section ref={previewRef} style={{ width: `${previewPct}%` }} className="flex min-w-0 flex-1 flex-col bg-navy-950">
        <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <div className="flex gap-1.5 pr-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <IconBtn title="Reload preview" onClick={() => setFrameKey((k) => k + 1)}>⟳</IconBtn>
          <form
            className="min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setPreviewUrl(urlDraft);
              setFrameKey((k) => k + 1);
            }}
          >
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-navy-900 px-4 py-1.5 text-xs text-white/80 outline-none focus:border-gold-400/60"
              spellCheck={false}
            />
          </form>
          <div className="hidden items-center gap-1 md:flex">
            {(['full', 'tablet', 'phone'] as const).map((d) => (
              <IconBtn key={d} title={d} onClick={() => setDevice(d)} active={device === d}>
                {d === 'full' ? '🖥' : d === 'tablet' ? '📱' : '📲'}
              </IconBtn>
            ))}
          </div>
          <span className="hidden rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/50 lg:inline">
            {repo.split('/')[1]} @ {branch}
          </span>
          <IconBtn title="Open in new tab" onClick={() => window.open(previewUrl, '_blank')}>↗</IconBtn>
          <IconBtn title="Fullscreen preview" onClick={goFullscreen}>⛶</IconBtn>
        </header>
        <div className="grid min-h-0 flex-1 place-items-center overflow-auto bg-[#0a1420] p-0">
          <iframe
            key={frameKey}
            src={previewUrl}
            title="Preview"
            className="h-full bg-white transition-all"
            style={{ width: device === 'full' ? '100%' : device === 'tablet' ? '768px' : '390px' }}
          />
        </div>
      </section>
    </div>
  );
}

/* ── small pieces ─────────────────────────────────────────────────────── */

function IconBtn({ children, title, onClick, active }: { children: ReactNode; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-sm transition ${active ? 'bg-white/10 text-gold-300' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

function ShedAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-semibold text-white/80 transition hover:border-gold-400/50 hover:text-gold-300"
    >
      {children}
    </button>
  );
}

function FileVault({
  catalog,
  setCatalog,
  onAttach,
}: {
  catalog: CatalogEntry[];
  setCatalog: Dispatch<SetStateAction<CatalogEntry[]>>;
  onAttach: (e: CatalogEntry) => void;
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'uploadedAt' | 'lastUsedAt' | 'size' | 'systemName'>('uploadedAt');

  const shown = useMemo(() => {
    const needle = q.toLowerCase();
    return catalog
      .filter(
        (e) =>
          !needle ||
          e.systemName.toLowerCase().includes(needle) ||
          e.originalName.toLowerCase().includes(needle) ||
          e.kind.includes(needle) ||
          e.category.includes(needle),
      )
      .sort((a, b) => {
        if (sort === 'size') return b.size - a.size;
        if (sort === 'systemName') return a.systemName.localeCompare(b.systemName);
        return (b[sort] ?? '').toString().localeCompare((a[sort] ?? '').toString());
      });
  }, [catalog, q, sort]);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex gap-1.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search catalog…"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-navy-900 px-2.5 py-1.5 text-xs outline-none focus:border-gold-400/60"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-lg border border-white/10 bg-navy-900 px-1.5 py-1.5 text-xs"
        >
          <option value="uploadedAt">Newest</option>
          <option value="lastUsedAt">Last used</option>
          <option value="size">Size</option>
          <option value="systemName">Name</option>
        </select>
      </div>
      {shown.length === 0 && <p className="pt-4 text-center text-xs text-white/40">No files yet — drop them into the Dev chat.</p>}
      <ul className="space-y-1.5">
        {shown.map((e) => (
          <li key={e.id} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
            <p className="truncate font-mono text-xs text-gold-300">{e.systemName}</p>
            <p className="truncate text-[11px] text-white/40">
              {e.kind} · {formatBytes(e.size)} · {e.uploadedAt.slice(0, 10)}
              {e.lastUsedAt ? ` · used ${e.lastUsedAt.slice(0, 10)}` : ''}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <select
                value={e.category}
                onChange={(ev) =>
                  setCatalog((c) => c.map((x) => (x.id === e.id ? { ...x, category: ev.target.value as VaultCategory } : x)))
                }
                className="rounded border border-white/10 bg-navy-900 px-1 py-0.5 text-[11px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  onAttach({ ...e, lastUsedAt: now() });
                  setCatalog((c) => c.map((x) => (x.id === e.id ? { ...x, lastUsedAt: now() } : x)));
                }}
                className="text-[11px] font-semibold text-gold-300 hover:text-gold-200"
              >
                Attach
              </button>
              <button
                onClick={() => setCatalog((c) => c.filter((x) => x.id !== e.id))}
                className="ml-auto text-[11px] text-white/40 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EnvVault({ vault, setVault }: { vault: EnvVarEntry[]; setVault: Dispatch<SetStateAction<EnvVarEntry[]>> }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);

  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/5 p-2.5">
        <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="KEY_NAME" className="w-full rounded border border-white/10 bg-navy-900 px-2 py-1 font-mono text-xs" />
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="secret value" type="password" className="w-full rounded border border-white/10 bg-navy-900 px-2 py-1 font-mono text-xs" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what it's for (optional)" className="w-full rounded border border-white/10 bg-navy-900 px-2 py-1 text-xs" />
        <button
          onClick={() => {
            if (!key || !value) return;
            setVault((v) => [{ id: uid(), key, value, note, addedAt: now() }, ...v]);
            setKey(''); setValue(''); setNote('');
          }}
          className="w-full rounded-lg bg-gold-500 py-1.5 text-xs font-bold text-navy-950 hover:bg-gold-400"
        >
          Add to vault
        </button>
      </div>
      <ul className="space-y-1.5">
        {vault.map((e) => (
          <li key={e.id} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
            <p className="truncate font-mono text-xs text-gold-300">{e.key}</p>
            <p className="truncate font-mono text-[11px] text-white/50">
              {revealed === e.id ? e.value : '••••••••••••'}
            </p>
            {e.note && <p className="truncate text-[11px] text-white/40">{e.note}</p>}
            <div className="mt-1 flex gap-2 text-[11px]">
              <button onClick={() => setRevealed(revealed === e.id ? null : e.id)} className="font-semibold text-gold-300 hover:text-gold-200">
                {revealed === e.id ? 'Hide' : 'Reveal'}
              </button>
              <button onClick={() => void navigator.clipboard.writeText(e.value)} className="text-white/50 hover:text-white">Copy</button>
              <button onClick={() => setVault((v) => v.filter((x) => x.id !== e.id))} className="ml-auto text-white/40 hover:text-red-300">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-relaxed text-white/40">
        Vault is stored locally in this browser. When the Dev backend connects, entries sync into the run manifest
        the way Dev files them.
      </p>
    </div>
  );
}
