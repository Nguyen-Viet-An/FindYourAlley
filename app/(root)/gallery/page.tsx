import { getAllEvents } from "@/lib/actions/event.actions";
import { getFestivals } from "@/lib/actions/festival.actions";
import GalleryGrid from "@/components/shared/GalleryGrid";

export const revalidate = 60;

type GalleryPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const festivals = await getFestivals(true);
  const festivalCode = (params?.festival as string) || festivals[0]?.code || undefined;
  const festival = festivals.find((f: any) => f.code === festivalCode) || festivals[0];
  const festivalId = festival?._id;
  const festivalIds = festivalId ? [festivalId] : [];

  // Fetch a large batch for the gallery
  const events = await getAllEvents({
    query: "",
    fandom: [],
    itemType: [],
    page: 1,
    limit: 200,
    festivalId: festivalIds,
    sortBy: "random",
  });

  // Flatten all images with event info
  const images = (events?.data || []).flatMap((event: any) =>
    (event.images || []).map((img: any, idx: number) => ({
      imageUrl: img.imageUrl,
      eventId: event._id,
      title: event.title,
      artists: event.artists?.map((a: any) => a.name).join(", ") || "",
      index: idx,
    }))
  );

  return (
    <section className="wrapper my-8 flex flex-col gap-8">
      <h2 className="h2-bold">🖼️ Gallery</h2>
      <p className="text-muted-foreground">Duyệt qua tất cả sample dưới dạng ảnh. Nhấn vào ảnh để xem chi tiết.</p>
      <GalleryGrid images={images} />
    </section>
  );
}
