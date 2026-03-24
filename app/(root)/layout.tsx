import Footer from "@/components/shared/Footer"
import Header from "@/components/shared/Header"
import TradeRequestNotification from "@/components/shared/TradeRequestNotification"
import { auth } from "@clerk/nextjs/server"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {userId && <TradeRequestNotification userId={userId} />}
    </div>
  )
}