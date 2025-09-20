"use client"

import EventForm from "@/components/shared/EventForm"
import { useAuth, SignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function CreateEvent() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        // Redirect to sign-in if no user
        router.push("/sign-in")
      } else {
        setAuthorized(true)
      }
    }
  }, [isLoaded, userId, router])

  if (!isLoaded || !authorized) {
    // Show a loader or placeholder while session is being checked
    return <div>Loading...</div>
  }

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Đăng Sample</h3>
      </section>

      <div className="wrapper my-8">
        <EventForm userId={userId} type="Create" />
      </div>
    </>
  )
}
