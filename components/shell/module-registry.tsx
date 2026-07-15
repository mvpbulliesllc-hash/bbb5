"use client"

import type { LucideIcon } from "lucide-react"
import {
  Globe,
  TerminalSquare,
  Video,
  Radio,
  ImagePlus,
  Instagram,
  FolderOpen,
  KeyRound,
  SendHorizontal,
  Search,
  FileText,
  BarChart3,
  SlidersHorizontal,
  LayoutGrid,
  Upload,
  Waypoints,
  Webhook,
} from "lucide-react"
import { BrowserView } from "./browser-view"

export type ModuleId =
  | "browser"
  | "terminal"
  | "video"
  | "live"
  | "image"
  | "social"
  | "files"
  | "env"
  | "outbound"
  | "research"
  | "notes"
  | "analytics"
  | "connectors"
  | "webhooks"
  | "config"
  | "empty"

export type ModuleGroup = "Surface" | "Social" | "Dev" | "Creative" | "System"

export type ModuleDef = {
  id: ModuleId
  label: string
  icon: LucideIcon
  group: ModuleGroup
  render: () => React.ReactNode
}

/**
 * Central registry of every module a container can become.
 * Add new capabilities here and they become available in every panel picker.
 */
export const MODULES: ModuleDef[] = [
  { id: "browser", label: "Browser", icon: Globe, group: "Surface", render: () => <BrowserView /> },
  { id: "video", label: "Video", icon: Video, group: "Surface", render: () => <VideoModule /> },
  { id: "live", label: "Live Feed", icon: Radio, group: "Surface", render: () => <LiveModule /> },
  { id: "analytics", label: "Analytics", icon: BarChart3, group: "Surface", render: () => <AnalyticsModule /> },

  { id: "social", label: "Socials", icon: Instagram, group: "Social", render: () => <SocialModule /> },
  { id: "outbound", label: "Outbound", icon: SendHorizontal, group: "Social", render: () => <OutboundModule /> },

  { id: "terminal", label: "Terminal", icon: TerminalSquare, group: "Dev", render: () => <TerminalModule /> },
  { id: "files", label: "Files", icon: FolderOpen, group: "Dev", render: () => <FilesModule /> },
  { id: "env", label: "Env Vault", icon: KeyRound, group: "Dev", render: () => <EnvModule /> },
  { id: "webhooks", label: "Webhooks", icon: Webhook, group: "Dev", render: () => <WebhooksModule /> },
  { id: "connectors", label: "Connectors", icon: Waypoints, group: "Dev", render: () => <ConnectorsModule /> },

  { id: "image", label: "Image Gen", icon: ImagePlus, group: "Creative", render: () => <ImageModule /> },
  { id: "notes", label: "Notes", icon: FileText, group: "Creative", render: () => <NotesModule /> },

  { id: "research", label: "Research", icon: Search, group: "System", render: () => <ResearchModule /> },
  { id: "config", label: "Config", icon: SlidersHorizontal, group: "System", render: () => <ConfigModule /> },
  { id: "empty", label: "Empty", icon: LayoutGrid, group: "System", render: () => <EmptyModule /> },
]

export const MODULE_MAP: Record<ModuleId, ModuleDef> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
) as Record<ModuleId, ModuleDef>

/* ---------------------------------- bodies --------------------------------- */

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-auto p-3">{children}</div>
}

function VideoModule() {
  return (
    <Pad>
      <div className="grid h-full min-h-40 place-items-center rounded-lg border border-line bg-void">
        <div className="text-center">
          <Video className="mx-auto size-6 text-text-faint" />
          <p className="mt-1 text-xs text-text-faint">Video surface — embed, stream, or agent capture</p>
        </div>
      </div>
    </Pad>
  )
}

function LiveModule() {
  return (
    <Pad>
      <div className="flex items-center gap-2 rounded-md border border-line bg-void px-2.5 py-1.5 text-xs">
        <span className="size-2 animate-pulse rounded-full bg-accent" />
        <span className="text-text-muted">Live session</span>
        <span className="ml-auto font-mono text-text-faint">00:00:00</span>
      </div>
      <div className="mt-2 grid min-h-32 place-items-center rounded-lg border border-line bg-void">
        <Radio className="size-6 text-text-faint" />
      </div>
    </Pad>
  )
}

function AnalyticsModule() {
  return (
    <Pad>
      <div className="grid grid-cols-2 gap-2">
        {["Sessions", "Leads", "Replies", "Conversions"].map((k) => (
          <div key={k} className="rounded-lg border border-line bg-void p-3">
            <p className="text-[11px] text-text-faint">{k}</p>
            <p className="mt-1 font-mono text-lg text-text">—</p>
          </div>
        ))}
      </div>
    </Pad>
  )
}

function SocialModule() {
  return (
    <Pad>
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-md border border-line bg-void" />
        ))}
      </div>
      <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-line py-1.5 text-xs text-text-muted transition-colors hover:bg-hover hover:text-text">
        <Upload className="size-3.5" />
        Connect account
      </button>
    </Pad>
  )
}

function OutboundModule() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <textarea
        placeholder="Compose outbound message…"
        className="flex-1 resize-none rounded-md border border-line bg-void p-2.5 text-xs text-text placeholder:text-text-faint focus:outline-none"
      />
      <button className="flex items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-void">
        <SendHorizontal className="size-3.5" />
        Send
      </button>
    </div>
  )
}

function TerminalModule() {
  return (
    <div className="h-full overflow-auto bg-void p-3 font-mono text-xs leading-relaxed text-text-muted">
      <p>
        <span className="text-accent-soft">$</span> agent run --team launch-campaign
      </p>
      <p className="text-text-faint">→ hermes: delegating 4 tasks…</p>
      <p className="text-text-faint">→ athena: scraping 3 sources…</p>
      <p className="mt-1">
        <span className="text-accent-soft">$</span> <span className="animate-pulse">▋</span>
      </p>
    </div>
  )
}

function FilesModule() {
  return (
    <Pad>
      <div className="space-y-0.5 text-xs">
        {["app/", "components/", "lib/", "public/", "package.json", ".env.local"].map((f) => (
          <div
            key={f}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-text-muted transition-colors hover:bg-hover"
          >
            <FolderOpen className="size-3.5 text-text-faint" />
            {f}
          </div>
        ))}
      </div>
    </Pad>
  )
}

function EnvModule() {
  return (
    <Pad>
      <div className="space-y-1.5 font-mono text-xs">
        {["HUME_API_KEY", "OPENAI_API_KEY", "TWILIO_AUTH_TOKEN", "STRIPE_SECRET_KEY", "NEON_DATABASE_URL"].map((k) => (
          <div key={k} className="flex items-center justify-between rounded-md border border-line bg-void px-2.5 py-1.5">
            <span className="text-text-muted">{k}</span>
            <span className="text-text-faint">••••••••</span>
          </div>
        ))}
      </div>
    </Pad>
  )
}

function WebhooksModule() {
  return (
    <Pad>
      <div className="space-y-1.5 text-xs">
        {["POST /hooks/inbound", "POST /hooks/stripe", "POST /hooks/twilio"].map((w) => (
          <div key={w} className="flex items-center justify-between rounded-md border border-line bg-void px-2.5 py-1.5 font-mono">
            <span className="text-text-muted">{w}</span>
            <span className="size-1.5 rounded-full bg-accent" />
          </div>
        ))}
      </div>
    </Pad>
  )
}

function ConnectorsModule() {
  return (
    <Pad>
      <div className="grid grid-cols-2 gap-2">
        {["Slack", "Notion", "Linear", "HubSpot", "Gmail", "Drive"].map((c) => (
          <button
            key={c}
            className="flex items-center gap-2 rounded-md border border-line bg-void px-2.5 py-2 text-xs text-text-muted transition-colors hover:bg-hover hover:text-text"
          >
            <Waypoints className="size-3.5 text-text-faint" />
            {c}
          </button>
        ))}
      </div>
    </Pad>
  )
}

function ImageModule() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-line bg-void">
        <div className="text-center">
          <ImagePlus className="mx-auto size-6 text-text-faint" />
          <p className="mt-1 text-xs text-text-faint">Generated output</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-line bg-void px-2.5 py-1.5">
        <input
          placeholder="Describe an image…"
          className="flex-1 bg-transparent text-xs text-text placeholder:text-text-faint focus:outline-none"
        />
        <button className="rounded bg-accent px-2 py-1 text-[11px] font-medium text-void">Gen</button>
      </div>
    </div>
  )
}

function NotesModule() {
  return (
    <div className="h-full p-3">
      <textarea
        placeholder="Scratch notes…"
        className="h-full w-full resize-none rounded-md border border-line bg-void p-2.5 text-xs leading-relaxed text-text placeholder:text-text-faint focus:outline-none"
      />
    </div>
  )
}

function ResearchModule() {
  return (
    <Pad>
      <div className="flex items-center gap-2 rounded-md border border-line bg-void px-2.5 py-1.5">
        <Search className="size-3.5 text-text-faint" />
        <input
          placeholder="Research query…"
          className="flex-1 bg-transparent text-xs text-text placeholder:text-text-faint focus:outline-none"
        />
      </div>
      <p className="mt-2 text-xs text-text-faint">Agent research results render here.</p>
    </Pad>
  )
}

function ConfigModule() {
  return (
    <Pad>
      <div className="space-y-3 text-xs">
        <Section title="Workspace">
          {["Theme: Obsidian", "Density: Comfortable", "Autosave layout: On"].map((r) => (
            <Row key={r}>{r}</Row>
          ))}
        </Section>
        <Section title="Agent defaults">
          {["Voice: Hume EVI", "Coordinator: Hermes", "Max swarm size: 12"].map((r) => (
            <Row key={r}>{r}</Row>
          ))}
        </Section>
      </div>
    </Pad>
  )
}

function EmptyModule() {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="text-center">
        <LayoutGrid className="mx-auto size-6 text-text-faint" />
        <p className="mt-1 text-xs text-text-faint">Empty container — pick a module from the header.</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-text-faint">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-void px-2.5 py-1.5 text-text-muted">
      {children}
    </div>
  )
}
