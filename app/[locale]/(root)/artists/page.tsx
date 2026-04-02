import { getAllArtists } from "@/lib/actions/event.actions";
import Link from "next/link";
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ArtistsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const festivals = (await (await import('@/lib/actions/festival.actions')).getFestivals(true)) || [];
  const festivalCode = params?.festival as string | undefined;
  const festival = festivalCode ? festivals.find((f: any) => f.code === festivalCode) : festivals[0];
  const festivalIds = festival?._id ? [festival._id] : undefined;

  const artists = await getAllArtists(festivalIds);
  const t = await getTranslations('artists');

  return (
    <section className="wrapper my-8 flex flex-col gap-8">
      <h2 className="h2-bold">{t('allArtists', { count: artists.length })}</h2>

      {artists.length > 0 ? (
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {artists.map((artist: any) => (
            <Link
              key={artist.name}
              href={`/artists/${encodeURIComponent(artist.name)}`}
              className="flex flex-col gap-1 rounded-xl border p-4 hover:bg-grey-50 dark:hover:bg-muted transition-colors"
            >
              <p className="font-semibold">{artist.name}</p>
              <p className="text-sm text-muted-foreground">{artist.eventCount} sample</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t('noArtists')}</p>
      )}
    </section>
  );
}