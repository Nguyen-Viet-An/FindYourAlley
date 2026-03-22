import EventForm from "@/components/shared/EventForm"
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFestivals } from "@/lib/actions/festival.actions";

export default async function CreateEvent() {
  const { sessionClaims } = await auth()

  const userId = sessionClaims?.userId as string;

  if (!userId) redirect('/sign-in');

  const festivals = await getFestivals(true);

  return (
    <>
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Đăng Sample</h3>
      </section>

      <div className="wrapper my-8">
        <EventForm userId={userId} type="Create" festivals={festivals} />
      </div>
    </>
  )
}
