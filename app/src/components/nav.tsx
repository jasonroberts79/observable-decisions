import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { signOut } from "@/lib/auth"
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
    <>
      {/* ── Mobile top bar (hidden at sm+) ── */}
      <header className="fixed inset-x-0 top-0 z-10 flex h-11 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:hidden">
        <div className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2.5} />
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            Observable Decisions
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "px-3 py-2 text-sm transition-colors",
                pathname.startsWith(href)
                  ? "font-medium text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/settings"
            className={cn(
              "px-3 py-2 text-sm transition-colors",
              pathname === "/settings"
                ? "font-medium text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            Settings
          </Link>
        </nav>
      </header>

      {/* ── Desktop sidebar (hidden below sm) ── */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r border-zinc-200 bg-white sm:flex">
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
              {user.email}
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
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
