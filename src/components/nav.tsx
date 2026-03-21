import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { logoutUrl } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Plus,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react"

const links = [
  { href: "/decisions", label: "Decisions", icon: BookOpen },
]

export function Nav() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-56 flex-col border-r border-zinc-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4">
        <ChevronRight className="h-4 w-4 text-zinc-400" strokeWidth={2.5} />
        <span className="text-sm font-semibold tracking-tight text-zinc-900">
          Decisions
        </span>
      </div>

      {/* Quick action */}
      <div className="px-3 pt-3">
        <Link
          to="/decisions/new"
          className="flex w-full items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Decision
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3 pt-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-zinc-100 text-zinc-900 font-medium"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-0.5 border-t border-zinc-200 px-3 py-3">
        {user && (
          <div className="mb-2 truncate px-2.5 text-xs text-zinc-400">
            {user.userDetails}
          </div>
        )}
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-zinc-100 text-zinc-900 font-medium"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <a
          href={logoutUrl}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </a>
      </div>
    </aside>
  )
}
