import CategoryFilter from '@/components/shared/CategoryFilter';
import HasPreorderFilter from '@/components/shared/HasPreorderFilter';
import Collection from '@/components/shared/Collection'
import Search from '@/components/shared/Search';
import { Button } from '@/components/ui/button'
import { getAllEvents } from '@/lib/actions/event.actions';
import { SearchParamProps } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { getEventIdsOrderedByUser } from '@/lib/actions/order.actions';
import { auth } from '@clerk/nextjs/server'

export default async function Home({ searchParams }: SearchParamProps) {
  const params = await searchParams;

  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  const page = Number(params?.page) || 1;
  const searchText = (params?.query as string) || '';

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

  const hasPreorder = params?.hasPreorder
    ? Array.isArray(params.hasPreorder)
      ? params.hasPreorder[0] === "true" ? "Yes" : "No"
      : params.hasPreorder === "true" ? "Yes" : "No"
    : undefined;

  const eventIdsOrdered = await getEventIdsOrderedByUser({ userId })

  // const orderedEvents = orders?.data.map((order: IOrder) => order.event) || [];

  const events = await getAllEvents({
    query: searchText,
    fandom: fandom,
    itemType: itemType,
    hasPreorder: hasPreorder,
    page,
    limit: 6
  });

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-contain py-5 md:py-10">
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
        <h2 className="h2-bold"> <br /> Sample COFI#14 </h2>

        <div className="flex w-full flex-col gap-2">
          {/* Line 1: Titles (except search) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div /> {/* Empty for search box placeholder */}
            <div className="font-semibold">Fandom</div>
            <div className="font-semibold">Loại mặt hàng</div>
            <div className="font-semibold">Mở preorder</div>
          </div>

          {/* Line 2: search + dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Search />
            </div>
            <div>
              <CategoryFilter key="fandom-filter" categoryFilterType="fandom" />
            </div>
            <div>
              <CategoryFilter key={`filter-${Math.random()}`} categoryFilterType="itemType" />
            </div>
            <div>
              <HasPreorderFilter />
            </div>
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