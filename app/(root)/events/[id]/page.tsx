import CheckoutButton from '@/components/shared/CheckoutButton';
import Collection from '@/components/shared/Collection';
import ImageCarousel from '@/components/shared/ImageCarousel';
import { getEventById, getRelatedEventsByCategories } from '@/lib/actions/event.actions'
import { ICategory } from '@/lib/database/models/category.model';
import { formatDateTime } from '@/lib/utils';
import { SearchParamProps } from '@/types'
import Image from 'next/image';
import mongoose from 'mongoose';
import { isValidUrl } from '@/lib/utils';

// Define both params and searchParams as Promises
export type paramsType = Promise<{ id: string }>;
export type searchParamsType = Promise<{ 
  [key: string]: string | string[] | undefined 
}>;

type Artist = {
  name: string;
  link?: string;
};

export const generateStaticParams = async () => {
  // If you have a list of events, you can generate static params
  // const events = await getAllEvents();
  // return events.map((event) => ({
  //   id: String(event.id),
  // }));
  
  // Or return an empty array if using dynamic routes
  return [];
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
  const categoryIds = event.images 
  ? event.images.flatMap((img: { category: any[] }) => 
      img.category.map(cat => 
        typeof cat === 'string' ? cat : new mongoose.Types.ObjectId(cat._id)
      )
    ) 
  : [];

  const requestedCategoryIds = event.images 
  ? event.images.flatMap((img: { category: any[] }) => 
      img.category.map(cat => 
        typeof cat === 'string' ? cat : cat._id.toString()
      )
    ) 
  : [];

  // Get related events based on the categories from images
  const relatedEvents = await getRelatedEventsByCategories({
    categoryIds: categoryIds,
    requestedCategoryIds: requestedCategoryIds,
    eventId: event._id,
    page: searchParams.page as string,
  });

  // Handle the case where images is undefined or empty
  const imageUrls = event.images && event.images.length > 0 
    ? event.images.map((img: any) => img.imageUrl || img.url) 
    : [event.imageUrl || '/assets/images/default-event-image.png'];

    return (
      <>
        <section className="flex justify-center bg-primary-50 bg-dotted-pattern bg-contain">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:max-w-7xl">
            {/* Image Carousel - Updated to respect image dimensions */}
            <div className="w-full h-auto aspect-square overflow-hidden"  style={{ aspectRatio: '4/3' }}>
              <ImageCarousel images={imageUrls} />
            </div>
    
            <div className="flex w-full flex-col gap-2 p-5 md:p-10">
              <div className="flex flex-col gap-6">
                <h2 className='h2-bold'>{event.title}</h2>
    
                <CheckoutButton event={event} />
    
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
                  {event.images && event.images
                    .flatMap((image: any) => 
                      image.category ? image.category.map((cat: ICategory) => cat.name) : []
                    )
                    .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) 
                    .map((categoryName: string, index: number) => (
                      <p
                        key={index}
                        className="p-medium-16 rounded-full bg-grey-500/10 px-4 py-2.5 text-grey-500"
                      >
                        {categoryName}
                      </p>
                    ))
                  }
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
              limit={3}
              page={searchParams.page as string}
              totalPages={relatedEvents?.totalPages}
              requestedCategoryIds={relatedEvents?.requestedCategoryIds} // Pass the requestedCategoryIds
            />
        </section>
      </>
    );
  }

export default EventDetails