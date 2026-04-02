import { getPopularFandoms, getPopularItemTypes, getPopularExtraTags, getRarestFandoms, getRarestItemTypes, getMostBookmarkedEvents, getTotalFandomCount, getPreorderCount, getDealCount, getMultiDayStats, getUniqueEventTitleCount } from "@/lib/actions/event.actions";
import { getFestivals } from "@/lib/actions/festival.actions";
import StatsCharts from "@/components/shared/StatsCharts";
import ExpandableGrid from "@/components/shared/ExpandableGrid";
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;
import Link from "next/link";

type StatsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const params = await searchParams;
  const festivals = await getFestivals(true);
  const festivalCode = (params?.festival as string) || festivals[0]?.code || undefined;
  const festival = festivals.find((f: any) => f.code === festivalCode) || festivals[0];
  const festivalId = festival?._id;
  const festivalIds = festivalId ? [festivalId] : undefined;
  const festivalName = festival?.code || festival?.name || '';

  const [fandoms, itemTypes, rawTags, rareFandoms, rareItemTypes, _mostBookmarked, totalFandoms, preorderCount, dealCount, multiDayStats, totalBooths] = await Promise.all([
    getPopularFandoms(10, festivalIds),
    getPopularItemTypes(10, festivalIds),
    getPopularExtraTags(20, festivalIds),
    getRarestFandoms(20, festivalIds),
    getRarestItemTypes(20, festivalIds),
    getMostBookmarkedEvents(10, festivalIds),
    getTotalFandomCount(festivalIds),
    getPreorderCount(festivalIds),
    getDealCount(festivalIds),
    getMultiDayStats(festivalIds),
    getUniqueEventTitleCount(festivalIds),
  ]);

  type StatDatum = { name: string; value: number; eventId?: string; eventTitle?: string };
  type BookmarkStat = { id: string; title: string; count: number; imageUrl?: string };

  const tags = rawTags.filter((tag: StatDatum) => tag.name && tag.name.trim() !== "");
  const t = await getTranslations('stats');

  const sortedPopularTags: StatDatum[] = tags
    .filter((tag: StatDatum) => tag.name)
    .sort((a: StatDatum, b: StatDatum) => b.value - a.value);

  return (
    <section className="wrapper my-8 flex flex-col gap-12">
      <h2 className="h2-bold mb-6">{t('pageTitle', { name: festivalName })}</h2>

      {/* Quick stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white dark:bg-card p-4 text-center">
          <p className="text-3xl font-bold text-primary-500">{totalBooths}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('totalBooths')}</p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-card p-4 text-center">
          <p className="text-3xl font-bold text-purple-500">{totalFandoms}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('totalFandoms')}</p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-card p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{preorderCount}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('preorderBooths')}</p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-card p-4 text-center">
          <p className="text-3xl font-bold text-pink-500">{dealCount}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('dealBooths')}</p>
        </div>
      </div>

      {/* Booths per day */}
      {multiDayStats.length > 1 && (
        <div className="w-full">
          <h3 className="h3-bold mb-2">{t('boothsPerDay')}</h3>
          <StatsCharts data={multiDayStats as StatDatum[]} color="#F59E0B" />
        </div>
      )}

      {/* Fandom chart */}
      <div className="w-full h-96 md:h-112">
        <h3 className="h3-bold mb-2">{t('popularFandom')}</h3>
        <StatsCharts data={fandoms as StatDatum[]} color="#8B6FC4" />
      </div>

      {/* Item Type chart */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">{t('popularItem')}</h3>
        <StatsCharts data={itemTypes as StatDatum[]} color="#6BC7D8" />
      </div>



      {/* Extra tags list */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">{t('popularTags')}</h3>
        <div className="flex flex-wrap gap-2">
          {sortedPopularTags.map((tag: StatDatum) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="px-3 py-1 bg-primary-500 rounded-full text-white hover:bg-primary-400 transition-colors"
            >
              <span>{tag.name}</span>&nbsp;
              <span className="text-xs text-gray-200">{tag.value}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Most bookmarked events - commented out for now
      {(mostBookmarked as BookmarkStat[]).length > 0 && (
        <div className="w-full">
          <h3 className="h3-bold mb-2">{t('mostBookmarked')}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(mostBookmarked as BookmarkStat[]).map((ev) => (
              <Link key={ev.id} href={`/events/${ev.id}`} className="p-4 rounded-lg border bg-white dark:bg-card hover:shadow transition flex flex-col gap-2">
                <p className="font-semibold line-clamp-2">{ev.title}</p>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">{ev.count} bookmark</p>
              </Link>
            ))}
          </div>
        </div>
      )}
      */}

      {/* Rare fandoms */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">{t('rareFandom')}</h3>
        <ExpandableGrid
          items={rareFandoms as StatDatum[]}
          initialCount={8}
          countLabel={t('boothCount', { count: '{count}' })}
        />
      </div>

      {/* Rare item types */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">{t('rareItem')}</h3>
        <ExpandableGrid
          items={rareItemTypes as StatDatum[]}
          initialCount={8}
          countLabel={t('boothCount', { count: '{count}' })}
        />
      </div>
    </section>
  );
}