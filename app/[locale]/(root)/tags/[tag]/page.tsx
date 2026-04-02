import { getEventsByTag } from "@/lib/actions/event.actions";
import { getFestivals } from "@/lib/actions/festival.actions";
import Collection from "@/components/shared/Collection";
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

type TagDetailPageProps = {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TagDetailPage({ params, searchParams }: TagDetailPageProps) {
  const { tag } = await params;
  const sp = await searchParams;
  const decodedTag = decodeURIComponent(tag);

  const festivals = await getFestivals(true);
  const festivalCode = (sp?.festival as string) || festivals[0]?.code || undefined;
  const festival = festivals.find((f: any) => f.code === festivalCode) || festivals[0];
  const festivalId = festival?._id;
  const festivalIds = festivalId ? [festivalId] : undefined;

  const events = await getEventsByTag(decodedTag, festivalIds);
  const t = await getTranslations('event');

  return (
    <section className="wrapper my-8">
      <h2 className="h2-bold mb-4">Tag: {decodedTag}</h2>
      <Collection
        data={events}
        emptyTitle={t('noSamples')}
        emptyStateSubtext={t('comeBackLater')}
        collectionType="All_Events"
        limit={10}
        page={1}
        totalPages={1}
      />
    </section>
  );
}
