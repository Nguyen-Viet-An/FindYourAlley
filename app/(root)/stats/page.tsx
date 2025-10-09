import { getPopularFandoms, getPopularItemTypes, getPopularExtraTags, getRarestFandoms, getRarestItemTypes, getMostBookmarkedEvents } from "@/lib/actions/event.actions";
import StatsCharts from "@/components/shared/StatsCharts";
import Link from "next/link";

export default async function StatsPage() {
  const fandoms = await getPopularFandoms(10);
  const itemTypes = await getPopularItemTypes(10);
  let tags = await getPopularExtraTags(20);
  const rareFandoms = await getRarestFandoms(10);
  const rareItemTypes = await getRarestItemTypes(10);
  const mostBookmarked = await getMostBookmarkedEvents(10);
  // const topArtists = await getTopArtists(10);
  // const emergingTags = await getEmergingTags(8, 14);

  type StatDatum = { name: string; value: number; eventId?: string; eventTitle?: string };
  type BookmarkStat = { id: string; title: string; count: number; imageUrl?: string };

  // Filter out empty or null tags (with typing)
  tags = tags.filter((tag: StatDatum) => tag.name && tag.name.trim() !== "");

  const sortedPopularTags: StatDatum[] = tags
    .filter((tag: StatDatum) => tag.name)
    .sort((a: StatDatum, b: StatDatum) => b.value - a.value);

  return (
    <section className="wrapper my-8 flex flex-col gap-12">
      <h2 className="h2-bold mb-6">📊 Thống kê COFI#15</h2>

      {/* Fandom chart */}
      <div className="w-full h-96 md:h-112">
        <h3 className="h3-bold mb-2">Fandom phổ biến</h3>
        <StatsCharts data={fandoms as StatDatum[]} color="#8B6FC4" />
      </div>

      {/* Item Type chart */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">Mặt hàng phổ biến</h3>
        <StatsCharts data={itemTypes as StatDatum[]} color="#6BC7D8" />
      </div>

      {/* Extra tags list */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">Tags phổ biến</h3>
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

      {/* Rare fandoms */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">Fandom hiếm </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rareFandoms.map((rf: StatDatum) => (
            <Link key={rf.name} href={rf.eventId ? `/events/${rf.eventId}` : '#'} className="p-3 rounded-lg border bg-white hover:shadow transition flex flex-col">
              <span className="font-medium">{rf.name}</span>
              <span className="text-xs text-gray-500 mt-1">Gian bán: {rf.value} </span>
              {rf.eventTitle && <span className="text-[11px] text-gray-600 mt-1 line-clamp-2">{rf.eventTitle}</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Rare item types */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">Mặt hàng hiếm </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rareItemTypes.map((ri: StatDatum) => (
            <Link key={ri.name} href={ri.eventId ? `/events/${ri.eventId}` : '#'} className="p-3 rounded-lg border bg-white hover:shadow transition flex flex-col">
              <span className="font-medium">{ri.name}</span>
              <span className="text-xs text-gray-500 mt-1">Gian bán: {ri.value}</span>
              {ri.eventTitle && <span className="text-[11px] text-gray-600 mt-1 line-clamp-2">{ri.eventTitle}</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Most bookmarked events
      <div className="w-full">
        <h3 className="h3-bold mb-2">Gian hàng được bookmark nhiều nhất</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mostBookmarked.map((ev: BookmarkStat) => (
            <Link key={ev.id} href={`/events/${ev.id}`} className="p-4 rounded-lg border bg-white hover:shadow transition flex flex-col gap-2">
              <p className="font-semibold line-clamp-2">{ev.title}</p>
              <p className="text-sm text-gray-500">{ev.count} bookmark</p>
            </Link>
          ))}
        </div>
      </div> */}

      {/* Top artists
      <div className="w-full">
        <h3 className="h3-bold mb-2">Artists xuất hiện nhiều</h3>
        <StatsCharts data={topArtists as StatDatum[]} color="#6366F1" />
      </div>

      {/* Emerging tags */}
      {/* <div className="w-full">
        <h3 className="h3-bold mb-2">Tags nổi lên 14 ngày gần đây</h3>
        <div className="flex flex-wrap gap-2">
          {emergingTags.map((tag: StatDatum) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="px-3 py-1 bg-pink-600 rounded-full text-white hover:bg-pink-500 transition-colors"
            >
              <span>{tag.name}</span>&nbsp;
              <span className="text-xs text-gray-200">{tag.value}</span>
            </Link>
          ))}
        </div>
      </div> */} 
    </section>
  );
}
