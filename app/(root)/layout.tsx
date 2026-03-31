import Footer from "@/components/shared/Footer"
import Header from "@/components/shared/Header"
import TradeRequestNotification from "@/components/shared/TradeRequestNotification"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="w-full bg-primary-500 dark:bg-gray-800 text-white text-center py-1.5 text-sm">
        <Link href="/guide" className="inline-flex items-center gap-1.5 hover:underline">
          <BookOpen className="h-3.5 w-3.5" />
          Tips để dùng web
        </Link>
      </div>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {userId && <TradeRequestNotification userId={userId} />}
    </div>
  )
}