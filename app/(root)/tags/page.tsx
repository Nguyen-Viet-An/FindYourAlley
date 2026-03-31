import Link from "next/link";
import { getAllExtraTags } from "@/lib/actions/event.actions";
import { getFestivals } from "@/lib/actions/festival.actions";

export const revalidate = 60;

type TagsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TagsPage({ searchParams }: TagsPageProps) {
  const params = await searchParams;
  const festivals = await getFestivals(true);
  const festivalCode = (params?.festival as string) || festivals[0]?.code || undefined;
  const festival = festivals.find((f: any) => f.code === festivalCode) || festivals[0];
  const festivalId = festival?._id;
  const festivalIds = festivalId ? [festivalId] : undefined;
  const tags = await getAllExtraTags(festivalIds);

  return (
    <section className="wrapper my-8">
      <h2 className="h2-bold mb-4">Tất cả Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}${festivalCode ? `?festival=${festivalCode}` : ''}`}
            className="px-3 py-1 bg-primary-100 rounded-full bg-primary-500 hover:bg-primary-400"
          >
            {tag}
          </Link>
        ))}
      </div>
    </section>
  )
}