import { getPopularFandoms, getPopularItemTypes, getPopularExtraTags } from "@/lib/actions/event.actions";
import StatsCharts from "@/components/shared/StatsCharts";
import Link from "next/link";

export default async function StatsPage() {
  const fandoms = await getPopularFandoms(10);
  const itemTypes = await getPopularItemTypes(10);
  let tags = await getPopularExtraTags(10);

  // Filter out empty or null tags
  tags = tags.filter(tag => tag.name && tag.name.trim() !== "");

  return (
    <section className="wrapper my-8 flex flex-col gap-12">
      <h2 className="h2-bold mb-6">📊 Thống kê</h2>

      {/* Fandom chart */}
      <div className="w-full h-96 md:h-112">
        <h3 className="h3-bold mb-2">Fandom phổ biến</h3>
        <StatsCharts data={fandoms} color="#8B6FC4" />
      </div>

      {/* Item Type chart */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">Mặt hàng phổ biến</h3>
        <StatsCharts data={itemTypes} color="#6BC7D8" />
      </div>

      {/* Extra tags list */}
      <div className="w-full">
        <h3 className="h3-bold mb-2">Tags phổ biến</h3>
        <div className="flex flex-wrap gap-2">
          {tags.filter(tag => tag.name).sort((a, b) => b.value - a.value).map((tag) => (
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
    </section>
  );
}
