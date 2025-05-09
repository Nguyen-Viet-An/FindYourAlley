import EventForm from "@/components/shared/EventForm"
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CreateEvent() {
  const { sessionClaims } = await auth()

  const userId = sessionClaims?.userId as string;

  if (!userId) redirect('/sign-in');
//   console.log(userId)
//   if (!userId) {
//     return <div>Unauthorized</div>; // Optionally handle unauthorized users
//   }

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

