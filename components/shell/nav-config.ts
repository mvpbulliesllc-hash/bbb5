import {
  LayoutGrid,
  MessagesSquare,
  Bot,
  FolderGit2,
  Palette,
  Share2,
  Terminal,
  Sparkles,
  Megaphone,
  FlaskConical,
  Plug,
  Cable,
  Webhook,
  Boxes,
  Settings,
  Home,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  badge?: string
}

export type NavSection = {
  id: string
  title?: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "primary",
    items: [
      { id: "home", label: "Home", icon: Home },
      { id: "projects", label: "Projects", icon: FolderGit2 },
      { id: "chats", label: "Chats", icon: MessagesSquare },
      { id: "agents", label: "Agents", icon: Bot },
      { id: "design", label: "Design System", icon: Palette },
    ],
  },
  {
    id: "hubs",
    title: "Hubs",
    items: [
      { id: "social", label: "Social Hub", icon: Share2 },
      { id: "dev", label: "Dev Hub", icon: Terminal },
      { id: "creative", label: "Creative Hub", icon: Sparkles },
      { id: "outbound", label: "Outbound Hub", icon: Megaphone },
      { id: "research", label: "Research Hub", icon: FlaskConical },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      { id: "integrations", label: "Integrations", icon: Plug },
      { id: "connectors", label: "Connectors", icon: Cable },
      { id: "api", label: "API & Webhooks", icon: Webhook },
      { id: "skills", label: "Skills Hub", icon: Boxes },
    ],
  },
]

export const NAV_FOOTER: NavItem[] = [{ id: "settings", label: "Settings", icon: Settings }]

export { LayoutGrid }
