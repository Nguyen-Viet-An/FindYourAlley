import BookmarkButton from '@/components/shared/BookmarkButton';
import Collection from '@/components/shared/Collection';
import ImageCarousel from '@/components/shared/ImageCarousel';
import ShareButton from '@/components/shared/ShareButton';
import { getEventById, getRelatedEventsByCategories, getBoothNeighbors } from '@/lib/actions/event.actions'
import { ICategory } from '@/lib/database/models/category.model';
import { formatDateTime } from '@/lib/utils';
import { SearchParamProps } from '@/types'
import Image from 'next/image';
import mongoose from 'mongoose';
import { isValidUrl } from '@/lib/utils';
import Link from 'next/link';
import Card from '@/components/shared/Card';
import CardLightbox from '@/components/shared/CardLightbox';

// Define both params and searchParams as Promises
export type paramsType = Promise<{ id: string }>;
export type searchParamsType = Promise<{
  [key: string]: string | string[] | undefined
}>;

type Artist = {
  name: string;
  link?: string;
};


const EventDetails = async (props: {
  params: paramsType,
  searchParams: searchParamsType
}) => {
  // Await both params and searchParams
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const event = await getEventById(id);

  // Fetch the category IDs from the images
  let categoryIds = event.images
  ? event.images.flatMap((img: { category: any[] }) =>
      img.category.map(cat =>
        typeof cat === 'string' ? cat : new mongoose.Types.ObjectId(cat._id)
      )
    )
  : [];

  let requestedCategoryIds = event.images
  ? event.images.flatMap((img: { category: any[] }) =>
      img.category.map(cat =>
        typeof cat === 'string' ? cat : cat._id.toString()
      )
    )
  : [];

  // Dedupe to avoid inflated counts
  requestedCategoryIds = Array.from(new Set(requestedCategoryIds));

  const RELATED_LIMIT = 8; // show up to 8 related events, single page

  // Get related events based on the categories from images (ensure backend uses same limit for pagination math)
  const relatedEvents = await getRelatedEventsByCategories({
    categoryIds: categoryIds,
    requestedCategoryIds: requestedCategoryIds,
    eventId: event._id,
    limit: RELATED_LIMIT,
    festivalId: event.festival?.length ? event.festival.map((f: any) => f._id) : undefined,
  });

  // Build unique category list with type for clickable links
  const uniqueCategoryMap = new Map<string, { name: string; type: string }>();
  if (event.images) {
    for (const img of event.images as any[]) {
      if (img.category) {
        for (const cat of img.category) {
          if (cat && cat.name && cat.type) {
            const key = `${cat.type}|${cat.name}`;
            if (!uniqueCategoryMap.has(key)) uniqueCategoryMap.set(key, { name: cat.name, type: cat.type });
          }
        }
      }
    }
  }
  const uniqueCategories = Array.from(uniqueCategoryMap.values());

  // Extract booth code from title for neighbor discovery
  const boothCodeMatch = event.title.match(/^([A-Z]+\d+)/i);
  const boothCode = boothCodeMatch ? boothCodeMatch[1].toUpperCase() : null;
  const neighborEvents = boothCode ? await getBoothNeighbors(boothCode) : [];

  // Handle the case where images is undefined or empty
  const imageUrls = event.images && event.images.length > 0
    ? event.images.map((img: any) => img.imageUrl || img.url)
    : [event.imageUrl || '/assets/images/broken-image.png'];

    return (
      <>
        <section className="flex justify-center bg-primary-50 dark:bg-muted bg-dotted-pattern bg-contain">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:max-w-7xl w-full border rounded-xl bg-white dark:bg-card shadow-sm m-4 md:m-8 overflow-hidden">
            {/* Image Carousel - enlarged & centered */}
            <div className="w-full flex items-center justify-center p-4 md:p-6 md:pr-4 group">
              <div className="relative w-full max-w-[720px] min-h-[420px] md:min-h-[520px] lg:min-h-[560px] max-h-[700px] 2xl:max-h-[760px] overflow-hidden flex items-center justify-center rounded-md transition-colors duration-200 group-hover:bg-neutral-900/5">
                <div className="relative w-full h-full">
                  <ImageCarousel images={imageUrls} />
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 p-5 md:p-10">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <h2 className='h2-bold'>{event.title}</h2>
                  <ShareButton title={event.title} />
                </div>

                {event.festival && event.festival.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.festival.map((f: any) => (
                      <span
                        key={f._id}
                        className="p-medium-14 rounded-full bg-violet-500/15 px-4 py-1.5 text-violet-600 dark:text-violet-400 font-semibold"
                      >
                        {f.code || f.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* <BookmarkButton event={event} /> */}

                {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="p-medium-18 ml-2 mt-2 sm:mt-0">
                    Đăng bởi {' '}
                    <span className="text-primary-500">{event.organizer.firstName} {event.organizer.lastName}</span>
                  </p>
                </div> */}
              </div>
              {/* Conditionally render the "Profile artist" and "Link preorder" */}
              {event.artists && event.artists.length > 0 && (
              <div className="mt-4">
                <h4 className="text-base font-semibold text-grey-600 dark:text-muted-foreground">Artists:</h4>
                <ul className="list-disc pl-5">
                  {event.artists.map((artist: Artist, index: number) => (
                    <li key={index}>
                      {artist.link ? (
                        <a
                          href={artist.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500"
                        >
                          {artist.name}
                        </a>
                      ) : (
                        <span>{artist.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.hasPreorder === "Yes" && event.url && (
              <div className="mt-4">
                {isValidUrl(event.url) ? (
                  <a
                    href={event.url.startsWith('http') ? event.url : `https://${event.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-blue-500"
                  >
                    Link preorder
                  </a>
                ) : (
                  <p className="text-base font-semibold">
                    Link preorder: {event.url}
                  </p>
                )}
                <p className="p-medium-16 lg:p-regular-18 mt-4">
                  Thời gian mở:
                </p>
                <div className="flex flex-col gap-5">
                  <div className="flex gap-2 md:gap-3">
                    <Image
                      src="/assets/icons/calendar.svg"
                      alt="calendar"
                      width={32}
                      height={32}
                    />
                    <div className="p-medium-16 lg:p-regular-20 flex flex-wrap items-center">
                      <p>
                        {formatDateTime(event.startDateTime).dateOnly} -{" "}
                        {formatDateTime(event.startDateTime).timeOnly}
                      </p>
                      <p>
                        {formatDateTime(event.endDateTime).dateOnly} -{" "}
                        {formatDateTime(event.endDateTime).timeOnly}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold text-grey-600 dark:text-muted-foreground">Giới thiệu về gian hàng:</p>
                <p className="text-sm whitespace-pre-line">{event.description}</p>
              </div>

              {/* Featured Product */}
              {event.featuredProduct?.imageUrl && event.featuredProduct?.description && (
                <div className="flex flex-col gap-3 mt-2 p-4 rounded-xl border border-yellow-300 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10">
                  <p className="text-base font-semibold flex items-center gap-2">⭐ Mặt hàng nổi bật</p>
                  <CardLightbox imageUrl={event.featuredProduct.imageUrl} alt="Mặt hàng nổi bật" renderImage={false}>
                    <div className="relative w-full max-w-xs h-48 rounded-lg overflow-hidden cursor-zoom-in">
                      <Image
                        src={event.featuredProduct.imageUrl}
                        alt="Mặt hàng nổi bật"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </CardLightbox>
                  <p className="text-sm">{event.featuredProduct.description}</p>
                </div>
              )}

              {/* Deal / Promotion */}
              {(event.dealBadge || event.dealDescription) && (
                <div className="flex flex-col gap-2 mt-2 p-4 rounded-xl border border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10">
                  <p className="text-base font-semibold flex items-center gap-2">🏷️ Ưu đãi</p>
                  {event.dealBadge && (
                    <span className="inline-block w-fit text-sm font-semibold bg-green-200 text-green-800 dark:bg-green-500/30 dark:text-green-300 px-3 py-1 rounded-full">
                      {event.dealBadge}
                    </span>
                  )}
                  {event.dealDescription && (
                    <p className="text-sm whitespace-pre-line">{event.dealDescription}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-3">
                  {uniqueCategories.map((cat) => (
                    <Link
                      key={`${cat.type}-${cat.name}`}
                      href={`/?${encodeURIComponent(cat.type)}=${encodeURIComponent(cat.name)}`}
                      className="text-sm rounded-full bg-grey-500/10 dark:bg-muted px-4 py-2.5 text-grey-500 dark:text-muted-foreground hover:bg-primary-500/10 hover:text-primary-600 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EVENTS with the same category */}
        <section className="wrapper my-8 flex flex-col gap-8 md:gap-12">
          <h2 className="h2-bold">Sample khác mà bạn có thể hứng thú</h2>

          <Collection
              data={relatedEvents?.data}
              emptyTitle="Không tìm thấy sample nào"
              emptyStateSubtext="Hãy trở lại sau"
              collectionType="All_Events"
              limit={RELATED_LIMIT}
              page={1}
              totalPages={1}
              requestedCategoryIds={relatedEvents?.requestedCategoryIds}
            />
        </section>

        {/* Booth Neighbors */}
        {neighborEvents.length > 0 && (
          <section className="wrapper my-8 flex flex-col gap-8">
            <h2 className="h2-bold">Gian hàng lân cận</h2>
            <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {neighborEvents.map((ne: any) => (
                <Card key={ne._id} event={ne} hideEdit hideBookmark />
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

export default EventDetails
