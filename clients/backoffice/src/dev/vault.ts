/**
 * Local catalog + vault for the Dev portal.
 *
 * Uploads are auto-renamed into a stable, human-findable system name
 * (`{KIND}-{YYYY-MM-DD}-{seq}-{slug}`), classified by kind and stored with
 * full metadata (size, upload day, last-used) so they can be filtered,
 * sorted and referenced in chat by name. File *bytes* stay in memory as
 * object URLs for the session; the catalog metadata persists in
 * localStorage so the index survives reloads.
 */

export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'spreadsheet'
  | 'doc'
  | 'archive'
  | 'code'
  | 'data'
  | 'other';

export type VaultCategory = 'inbox' | 'priority' | 'components' | 'design' | 'media' | 'docs';

export interface CatalogEntry {
  id: string;
  systemName: string;
  originalName: string;
  kind: FileKind;
  category: VaultCategory;
  size: number;
  uploadedAt: string; // ISO
  lastUsedAt: string | null; // ISO
  url?: string; // session-only object URL
}

export interface EnvVarEntry {
  id: string;
  key: string;
  value: string;
  note: string;
  addedAt: string;
}

const CATALOG_KEY = 'dev.catalog.v1';
const ENV_KEY = 'dev.envvault.v1';

const KIND_BY_EXT: Record<string, FileKind> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', heic: 'image',
  mp4: 'video', mov: 'video', webm: 'video', mkv: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio',
  pdf: 'pdf',
  csv: 'spreadsheet', xlsx: 'spreadsheet', xls: 'spreadsheet', numbers: 'spreadsheet',
  doc: 'doc', docx: 'doc', txt: 'doc', md: 'doc', rtf: 'doc', pages: 'doc',
  zip: 'archive', tar: 'archive', gz: 'archive', rar: 'archive', '7z': 'archive',
  ts: 'code', tsx: 'code', js: 'code', jsx: 'code', cs: 'code', py: 'code', css: 'code', html: 'code', astro: 'code',
  json: 'data', yaml: 'data', yml: 'data', xml: 'data', env: 'data',
};

const KIND_PREFIX: Record<FileKind, string> = {
  image: 'IMG', video: 'VID', audio: 'AUD', pdf: 'PDF', spreadsheet: 'SHEET',
  doc: 'DOC', archive: 'ZIP', code: 'CODE', data: 'DATA', other: 'FILE',
};

export function classify(name: string): FileKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return KIND_BY_EXT[ext] ?? 'other';
}

function slug(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'untitled'
  );
}

export function loadCatalog(): CatalogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(CATALOG_KEY) ?? '[]') as CatalogEntry[];
  } catch {
    return [];
  }
}

export function saveCatalog(entries: CatalogEntry[]): void {
  // Object URLs are session-only; never persist them.
  const clean = entries.map(({ url: _url, ...rest }) => rest);
  localStorage.setItem(CATALOG_KEY, JSON.stringify(clean));
}

export function catalogFile(file: File, existing: CatalogEntry[]): CatalogEntry {
  const kind = classify(file.name);
  const day = new Date().toISOString().slice(0, 10);
  const seq = existing.filter((e) => e.kind === kind && e.uploadedAt.startsWith(day)).length + 1;
  const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
  return {
    id: crypto.randomUUID(),
    systemName: `${KIND_PREFIX[kind]}-${day}-${String(seq).padStart(3, '0')}-${slug(file.name)}${ext}`,
    originalName: file.name,
    kind,
    category: 'inbox',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    lastUsedAt: null,
    url: URL.createObjectURL(file),
  };
}

export function loadEnvVault(): EnvVarEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ENV_KEY) ?? '[]') as EnvVarEntry[];
  } catch {
    return [];
  }
}

export function saveEnvVault(entries: EnvVarEntry[]): void {
  localStorage.setItem(ENV_KEY, JSON.stringify(entries));
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
