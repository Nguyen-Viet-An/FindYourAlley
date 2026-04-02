import EventForm from "@/components/shared/EventForm"
import { auth } from "@clerk/nextjs/server"
import { getEventById } from "@/lib/actions/event.actions"
import { getFestivals } from "@/lib/actions/festival.actions"
import { getTranslations } from 'next-intl/server';


type UpdateEventProps = {
  params: Promise<{
    id: string
  }>
}

const UpdateEvent = async (props: UpdateEventProps) => {
  const params = await props.params;

  const {
    id
  } = params;

  const { sessionClaims } = await auth();

  const userId = sessionClaims?.userId as string;
  const event = await getEventById(id)
  const festivals = await getFestivals(true);
  const t = await getTranslations('event');

  return (
    <>
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">{t('updateSample')}</h3>
      </section>

      <div className="wrapper my-8">
        <EventForm
          type="Update"
          event={event}
          eventId={event._id}
          userId={userId}
          festivals={festivals}
        />
      </div>
    </>
  )
}

export default UpdateEvent