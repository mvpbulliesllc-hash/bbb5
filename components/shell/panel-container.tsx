"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Check, PanelLeftClose, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MODULES, MODULE_MAP, type ModuleId, type ModuleGroup } from "./module-registry"

const GROUP_ORDER: ModuleGroup[] = ["Surface", "Social", "Dev", "Creative", "System"]

export function PanelContainer({
  defaultModule,
  onCollapse,
  collapseIcon = "chevron",
  className,
}: {
  defaultModule: ModuleId
  /** When provided, a collapse button is shown that calls this handler. */
  onCollapse?: () => void
  collapseIcon?: "chevron" | "x" | "panel"
  className?: string
}) {
  const [moduleId, setModuleId] = useState<ModuleId>(defaultModule)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = MODULE_MAP[moduleId]
  const CurrentIcon = current.icon

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  const CollapseIcon = collapseIcon === "x" ? X : collapseIcon === "panel" ? PanelLeftClose : ChevronDown

  return (
    <div ref={rootRef} className={cn("flex h-full flex-col bg-panel", className)}>
      {/* Container header — module picker + collapse */}
      <div className="relative flex h-9 shrink-0 items-center gap-1 border-b border-line px-1.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-text transition-colors hover:bg-hover"
        >
          <CurrentIcon className="size-3.5 text-accent" />
          {current.label}
          <ChevronDown className="size-3 text-text-faint" />
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          {onCollapse ? (
            <button
              onClick={onCollapse}
              title="Collapse"
              className="grid size-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-hover hover:text-text"
            >
              <CollapseIcon className="size-3.5" />
            </button>
          ) : null}
        </div>

        {open ? (
          <div className="absolute left-1.5 top-full z-40 mt-1 max-h-80 w-52 overflow-auto rounded-lg border border-line-strong bg-elevated p-1 shadow-2xl shadow-black/60">
            {GROUP_ORDER.map((group) => {
              const items = MODULES.filter((m) => m.group === group)
              if (!items.length) return null
              return (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-faint">{group}</p>
                  {items.map((m) => {
                    const Icon = m.icon
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModuleId(m.id)
                          setOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-text-muted transition-colors hover:bg-hover hover:text-text"
                      >
                        <Icon className="size-4 text-text-faint" />
                        <span className="flex-1">{m.label}</span>
                        {m.id === moduleId ? <Check className="size-3.5 text-accent" /> : null}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* Container body — the active module */}
      <div className="min-h-0 flex-1 overflow-hidden">{current.render()}</div>
    </div>
  )
}
