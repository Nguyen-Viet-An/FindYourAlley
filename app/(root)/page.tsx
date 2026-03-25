import CategoryMultiFilter from '@/components/shared/CategoryMultiFilter';
import HasPreorderFilter from '@/components/shared/HasPreorderFilter';
import Collection from '@/components/shared/Collection'
import SortSelect from '@/components/shared/SortSelect';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import { Button } from '@/components/ui/button'
import { getAllEvents, getUniqueEventTitleCount, getSearchSuggestions } from '@/lib/actions/event.actions';
import { SearchParamProps } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { getEventIdsOrderedByUser } from '@/lib/actions/order.actions';
import { auth } from '@clerk/nextjs/server'
import { getFestivals, ensureDefaultFestival } from '@/lib/actions/festival.actions';
import FestivalFilter from '@/components/shared/FestivalFilter';
import DayFilter from '@/components/shared/DayFilter';

export default async function Home({ searchParams }: SearchParamProps) {
  const params = await searchParams;
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  const page = Number(params?.page) || 1;
  const searchText = (params?.query as string) || '';
  const sortBy = (params?.sortBy as string) || 'newest';
  // uniqueEventTitleCount is fetched below after selectedFestivalIds is determined

  const fandom = Array.isArray(params?.fandom)
    ? params.fandom
    : params?.fandom
      ? params.fandom.split(",")
      : [];

  const itemType = Array.isArray(params?.itemType)
    ? params.itemType
    : params?.itemType
      ? params.itemType.split(",")
      : [];

  const excludeFandom = Array.isArray(params?.excludeFandom)
    ? params.excludeFandom
    : params?.excludeFandom
      ? params.excludeFandom.split(",")
      : [];

  const excludeItemType = Array.isArray(params?.excludeItemType)
    ? params.excludeItemType
    : params?.excludeItemType
      ? params.excludeItemType.split(",")
      : [];

  const hasPreorder = params?.hasPreorder
    ? Array.isArray(params.hasPreorder)
      ? params.hasPreorder[0] === "true" ? "Yes" : "No"
      : params.hasPreorder === "true" ? "Yes" : "No"
    : undefined;

  // Detect "Ưu đãi" virtual item inside itemType filter
  const DEAL_VIRTUAL_NAME = "Ưu đãi / Freebie";
  const hasDeal = itemType.includes(DEAL_VIRTUAL_NAME);
  const actualItemType = itemType.filter((t) => t !== DEAL_VIRTUAL_NAME);

  // await ensureDefaultFestival();
  const festivals = await getFestivals(true);
  const rawFestivalParam = params?.festivalId;
  const selectedFestivalIds: string[] = rawFestivalParam
    ? (Array.isArray(rawFestivalParam) ? rawFestivalParam : String(rawFestivalParam).split(',').filter(Boolean))
    : (festivals[0]?._id ? [festivals[0]._id] : []);

  // Day filter for multi-day festivals
  const selectedFestival = festivals.find((f: any) => f._id === selectedFestivalIds[0]);
  const festivalDayParam = params?.festivalDay ? Number(params.festivalDay) : undefined;

  const [eventIdsOrdered, events, suggestions, uniqueEventTitleCount] = await Promise.all([
    getEventIdsOrderedByUser({ userId }),
    getAllEvents({
      query: searchText,
      fandom,
      itemType: actualItemType,
      excludeFandom,
      excludeItemType,
      hasPreorder,
      hasDeal: hasDeal || undefined,
      page,
      limit: 20,
      festivalId: selectedFestivalIds,
      sortBy: sortBy as any,
      festivalDay: festivalDayParam,
    }),
    getSearchSuggestions(),
    getUniqueEventTitleCount(selectedFestivalIds),
  ]);

  const selectedFestivalParam = selectedFestivalIds[0] ? `?festivalId=${selectedFestivalIds[0]}` : '';

  return (
    <>
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-contain py-5 md:py-10">
        <div className="wrapper grid grid-cols-1 gap-5 md:grid-cols-2 2xl:gap-0">
          <div className="flex flex-col justify-center gap-8">
            <h1 className="h1-bold">Tìm, bookmark sample của artists nhanh và dễ dàng!</h1>
            <Button size="lg" asChild className="button w-full sm:w-fit">
              <Link href="#events">
                Tìm kiếm sample
              </Link>
            </Button>
          </div>

          <Image
            src="/assets/images/gen.png"
            alt="kimitowatshi"
            width={1000}
            height={1000}
            className="max-h-[70vh] object-contain object-center 2xl:max-h-[50vh]"
          />
        </div>
      </section>

      <section id="events" className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="h2-bold whitespace-nowrap">Sample</h2>
            <div className="w-48">
              <FestivalFilter festivals={festivals} />
            </div>
            {selectedFestival?.startDate && selectedFestival?.endDate && (
              <DayFilter
                startDate={selectedFestival.startDate}
                endDate={selectedFestival.endDate}
              />
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button size="sm" asChild className="bg-primary-500 hover:bg-primary-400 text-white">
              <Link href={`/tags${selectedFestivalParam}`}>Tags</Link>
            </Button>
            <Button size="sm" asChild className="bg-primary-500 hover:bg-primary-400 text-white">
              <Link href={`/stats${selectedFestivalParam}`}>Thống kê</Link>
            </Button>
            <Button size="sm" asChild className="bg-primary-500 hover:bg-primary-400 text-white">
              <Link href={`/map${selectedFestivalParam}`}>Sơ đồ</Link>
            </Button>
            <Button size="sm" asChild className="bg-primary-500 hover:bg-primary-400 text-white">
              <Link href={`/artists${selectedFestivalParam}`}>Artists</Link>
            </Button>
            {/* <Button size="sm" asChild className="bg-primary-500 hover:bg-primary-400 text-white">
              <Link href={`/gallery${selectedFestivalParam}`}>Gallery</Link>
            </Button> */}
            <Button size="sm" asChild className="bg-blue-500 hover:bg-blue-400 text-white">
              <Link href={`/featured${selectedFestivalParam}`}>Mặt hàng nổi bật</Link>
            </Button>
            <Button size="sm" asChild className="bg-pink-500 hover:bg-pink-400 text-white">
              <Link href={`/oc-cards${selectedFestivalParam}`}>OC Trading Cards</Link>
            </Button>
          </div>

          <span className="text-grey-700 dark:text-muted-foreground text-base md:text-lg">
            Hiện đã có sample của
            <span className="text-primary-500 font-semibold ml-1 text-2xl">{uniqueEventTitleCount} </span>
            gian hàng.
          </span>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-end">
            <div>
              <div className="font-semibold mb-1">Tìm kiếm</div>
              <SearchAutocomplete suggestions={suggestions as any} />
            </div>
            <div>
              <div className="font-semibold mb-1">Fandom <span className="text-xs text-muted-foreground">(✓ chọn, ✕ loại trừ)</span></div>
              <CategoryMultiFilter categoryFilterType="fandom" excludeParamKey="excludeFandom" />
            </div>
            <div>
              <div className="font-semibold mb-1">Loại mặt hàng <span className="text-xs text-muted-foreground">(✓/✕)</span></div>
              <CategoryMultiFilter
                categoryFilterType="itemType"
                excludeParamKey="excludeItemType"
                pinnedItems={[{ id: "__deal", name: "Ưu đãi / Freebie", emoji: "🏷️" }]}
              />
            </div>
            <div>
              <div className="font-semibold mb-1">Mở preorder</div>
              <HasPreorderFilter />
            </div>
            <SortSelect />
          </div>
        </div>

        <Collection
          data={events?.data}
          ordered={eventIdsOrdered}
          emptyTitle="Không tìm thấy sample nào"
          emptyStateSubtext="Hãy trở lại sau"
          collectionType="All_Events"
          limit={20}
          page={page}
          totalPages={events?.totalPages}
          urlParamName="page"
          requestedCategoryIds={events?.requestedCategoryIds}
        />
      </section>
    </>
  )
}