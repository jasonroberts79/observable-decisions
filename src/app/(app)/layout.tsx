import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Nav } from "@/components/nav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/signin")

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="ml-56 flex-1 p-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  )
}
