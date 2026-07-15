"use client"

import { useRef, useState } from "react"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { PanelLeftOpen } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { LeftNav } from "./left-nav"
import { AgentPanel } from "./agent-panel"
import { BrowserView } from "./browser-view"
import { ConfigDock } from "./config-dock"
import { TopBar } from "./top-bar"

export function Workbench() {
  const leftRef = useRef<ImperativePanelHandle>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState("agents")

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
      <TopBar />

      <div className="relative min-h-0 flex-1">
        {/* Floating opener when the nav is collapsed */}
        {collapsed ? (
          <button
            onClick={() => leftRef.current?.expand()}
            title="Open sidebar"
            className="gloss-elevated absolute left-2 top-2 z-40 grid size-8 place-items-center rounded-md border border-line text-text-muted transition-colors hover:text-text"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        ) : null}

        <ResizablePanelGroup direction="horizontal" autoSaveId="obsidian-shell-h">
          {/* LEFT — navigation (0–20%) */}
          <ResizablePanel
            ref={leftRef}
            id="nav"
            order={1}
            defaultSize={16}
            minSize={12}
            maxSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => setCollapsed(true)}
            onExpand={() => setCollapsed(false)}
          >
            <LeftNav active={active} onSelect={setActive} onCollapse={() => leftRef.current?.collapse()} />
          </ResizablePanel>

          <ResizableHandle />

          {/* MIDDLE — agent chat (10–35%) */}
          <ResizablePanel id="agents" order={2} defaultSize={26} minSize={10} maxSize={35}>
            <AgentPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT — main surface (~60%) with a configurable split dock */}
          <ResizablePanel id="main" order={3} defaultSize={58} minSize={40}>
            <ResizablePanelGroup direction="vertical" autoSaveId="obsidian-shell-v">
              <ResizablePanel id="browser" order={1} defaultSize={64} minSize={30}>
                <BrowserView />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel id="dock" order={2} defaultSize={36} minSize={12} collapsible collapsedSize={0}>
                <ConfigDock />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
