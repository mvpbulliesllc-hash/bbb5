"use client"

import { useState } from "react"
import {
  Instagram,
  KeyRound,
  FolderOpen,
  ImagePlus,
  SendHorizontal,
  TerminalSquare,
  ChevronDown,
  Check,
  Plus,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ModuleId = "ig" | "env" | "files" | "image" | "outbound" | "terminal"

const MODULES: { id: ModuleId; label: string; icon: typeof Instagram }[] = [
  { id: "ig", label: "IG Feed", icon: Instagram },
  { id: "env", label: "Env Vault", icon: KeyRound },
  { id: "files", label: "Project Files", icon: FolderOpen },
  { id: "image", label: "Image Gen", icon: ImagePlus },
  { id: "outbound", label: "Outbound", icon: SendHorizontal },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
]

export function ConfigDock() {
  const [module, setModule] = useState<ModuleId>("env")
  const [open, setOpen] = useState(false)
  const current = MODULES.find((m) => m.id === module)!
  const CurrentIcon = current.icon

  return (
    <div className="gloss flex h-full flex-col border-t border-line">
      {/* Dock header — module selector */}
      <div className="relative flex shrink-0 items-center gap-2 border-b border-line px-2 py-1.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-text transition-colors hover:bg-hover"
        >
          <CurrentIcon className="size-4 text-accent" />
          {current.label}
          <ChevronDown className="size-3.5 text-text-faint" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button className="grid size-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-hover hover:text-text">
            <Plus className="size-4" />
          </button>
        </div>

        {open ? (
          <div className="absolute left-2 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-line-strong bg-elevated p-1 shadow-2xl shadow-black/60">
            {MODULES.map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setModule(m.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-text-muted transition-colors hover:bg-hover hover:text-text"
                >
                  <Icon className="size-4 text-text-faint" />
                  <span className="flex-1">{m.label}</span>
                  {m.id === module ? <Check className="size-3.5 text-accent" /> : null}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* Dock body */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <DockBody module={module} />
      </div>
    </div>
  )
}

function DockBody({ module }: { module: ModuleId }) {
  switch (module) {
    case "env":
      return (
        <div className="space-y-1.5 font-mono text-xs">
          {[
            "HUME_API_KEY",
            "OPENAI_API_KEY",
            "TWILIO_AUTH_TOKEN",
            "STRIPE_SECRET_KEY",
            "NEON_DATABASE_URL",
          ].map((k) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-md border border-line bg-void px-2.5 py-1.5"
            >
              <span className="text-text-muted">{k}</span>
              <span className="text-text-faint">••••••••</span>
            </div>
          ))}
        </div>
      )
    case "files":
      return (
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
      )
    case "image":
      return (
        <div className="flex h-full flex-col gap-2">
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
    case "outbound":
      return (
        <div className="flex h-full flex-col gap-2">
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
    case "terminal":
      return (
        <div className="h-full rounded-md bg-void p-2.5 font-mono text-xs leading-relaxed text-text-muted">
          <p><span className="text-accent-soft">$</span> agent run --team launch-campaign</p>
          <p className="text-text-faint">→ hermes: delegating 4 tasks…</p>
          <p className="text-text-faint">→ athena: scraping 3 sources…</p>
          <p className="mt-1"><span className="text-accent-soft">$</span> <span className="animate-pulse">▋</span></p>
        </div>
      )
    case "ig":
    default:
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md border border-line bg-void" />
          ))}
          <button className="col-span-3 mt-1 flex items-center justify-center gap-2 rounded-md border border-line py-1.5 text-xs text-text-muted transition-colors hover:bg-hover hover:text-text">
            <Upload className="size-3.5" />
            Connect Instagram
          </button>
        </div>
      )
  }
}
