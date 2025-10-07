import BookmarkButton from '@/components/shared/BookmarkButton';
import Collection from '@/components/shared/Collection';
import ImageCarousel from '@/components/shared/ImageCarousel';
import { getEventById, getRelatedEventsByCategories } from '@/lib/actions/event.actions'
import { ICategory } from '@/lib/database/models/category.model';
import { formatDateTime } from '@/lib/utils';
import { SearchParamProps } from '@/types'
import Image from 'next/image';
import mongoose from 'mongoose';
import { isValidUrl } from '@/lib/utils';
import Link from 'next/link';

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
    festivalId: event.festival?._id || undefined,
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

  // Handle the case where images is undefined or empty
  const imageUrls = event.images && event.images.length > 0
    ? event.images.map((img: any) => img.imageUrl || img.url)
    : [event.imageUrl || '/assets/images/broken-image.png'];

    return (
      <>
        <section className="flex justify-center bg-primary-50 bg-dotted-pattern bg-contain">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:max-w-7xl w-full">
            {/* Image Carousel - enlarged & centered */}
            <div className="w-full flex items-center justify-center md:pr-4 group">
              <div className="relative w-full max-w-[720px] min-h-[420px] md:min-h-[520px] lg:min-h-[560px] max-h-[700px] 2xl:max-h-[760px] overflow-hidden flex items-center justify-center rounded-md transition-colors duration-200 group-hover:bg-neutral-900/5">
                <div className="relative w-full h-full">
                  <ImageCarousel images={imageUrls} />
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 p-5 md:p-10">
              <div className="flex flex-col gap-6">
                <h2 className='h2-bold'>{event.title}</h2>

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
                <h4 className="p-bold-20 text-grey-600">Artists:</h4>
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
                    className="p-bold-20 text-blue-500"
                  >
                    Link preorder
                  </a>
                ) : (
                  <p className="p-bold-20">
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
                <p className="p-bold-20 text-grey-600">Giới thiệu về gian hàng:</p>
                <p className="p-medium-16 lg:p-regular-18 whitespace-pre-line">{event.description}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-3">
                  {uniqueCategories.map((cat) => (
                    <Link
                      key={`${cat.type}-${cat.name}`}
                      href={`/?${encodeURIComponent(cat.type)}=${encodeURIComponent(cat.name)}`}
                      className="p-medium-16 rounded-full bg-grey-500/10 px-4 py-2.5 text-grey-500 hover:bg-primary-500/10 hover:text-primary-600 transition-colors"
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
              requestedCategoryIds={relatedEvents?.requestedCategoryIds} // Pass the requestedCategoryIds
            />
        </section>
      </>
    );
  }

export default EventDetails