import { Outlet } from "react-router-dom"
import { Nav } from "@/components/nav"

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="ml-56 flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
