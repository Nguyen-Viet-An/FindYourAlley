import { getEventsByArtist } from "@/lib/actions/event.actions";
import Card from "@/components/shared/Card";
import Link from "next/link";
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

export type paramsType = Promise<{ name: string }>;

export default async function ArtistDetailPage({ params }: { params: paramsType }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const events = await getEventsByArtist(decodedName);
  const t = await getTranslations('artists');

  return (
    <section className="wrapper my-8 flex flex-col gap-8">
      <div>
        <Link href="/artists" className="text-sm text-primary-500 hover:underline">{t('backToAll')}</Link>
        <h2 className="h2-bold mt-2">{decodedName}</h2>
        <p className="text-muted-foreground">{events.length} sample</p>
      </div>

      {events.length > 0 ? (
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event: any) => (
            <Card key={event._id} event={event} hideEdit />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t('noSamples')}</p>
      )}
    </section>
  );
}