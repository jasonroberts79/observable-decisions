import { Outlet } from "react-router-dom"
import { Nav } from "@/components/nav"

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 pt-[calc(44px+1rem)] sm:ml-56 sm:p-8 sm:pt-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
