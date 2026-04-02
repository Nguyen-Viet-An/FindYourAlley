import { getFeaturedProducts } from "@/lib/actions/event.actions";
import { getFestivals } from "@/lib/actions/festival.actions";
import FeaturedGallery from "@/components/shared/FeaturedGallery";
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

type FeaturedPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FeaturedPage({ searchParams }: FeaturedPageProps) {
  const params = await searchParams;
  const festivals = await getFestivals(true);
  const festivalCode = (params?.festival as string) || festivals[0]?.code || undefined;
  const festival = festivals.find((f: any) => f.code === festivalCode) || festivals[0];
  const festivalId = festival?._id;
  const festivalIds = festivalId ? [festivalId] : [];

  const events = await getFeaturedProducts(festivalIds);

  const items = events.map((ev: any) => ({
    eventId: ev._id,
    eventTitle: ev.title,
    imageUrl: ev.featuredProduct?.imageUrl || "",
    description: ev.featuredProduct?.description || "",
    artists: Array.isArray(ev.artists)
      ? ev.artists.map((a: any) => a.name).join(", ")
      : "",
    dealBadge: ev.dealBadge || undefined,
  }));

  const t = await getTranslations('featured');

  return (
    <div className="wrapper my-8 flex flex-col gap-8">
      <h2 className="h2-bold">{t('title')}</h2>
      <p className="text-muted-foreground -mt-4">
        {t('description')}
      </p>
      <FeaturedGallery items={items} />
    </div>
  );
}