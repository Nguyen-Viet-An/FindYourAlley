import CheckoutButton from '@/components/shared/CheckoutButton';
import Collection from '@/components/shared/Collection';
import ImageCarousel from '@/components/shared/ImageCarousel';
import { getEventById, getRelatedEventsByCategories } from '@/lib/actions/event.actions'
import { ICategory } from '@/lib/database/models/category.model';
import { formatDateTime } from '@/lib/utils';
import { SearchParamProps } from '@/types'
import Image from 'next/image';
import mongoose from 'mongoose';

const EventDetails = async ({ params: { id }, searchParams }: SearchParamProps) =>  {
  // const searchParams = await props.searchParams;
  // const params = await props.params;

  // const { id } = params;
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
        {/* Image Carousel */}
        <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full">
          <ImageCarousel images={imageUrls} />
        </div>

        <div className="flex w-full flex-col gap-2 p-5 md:p-10">
          <div className="flex flex-col gap-6">
            <h2 className='h2-bold'>{event.title}</h2>

            {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="p-medium-18 ml-2 mt-2 sm:mt-0">
                Đăng bởi {' '}
                <span className="text-primary-500">{event.organizer.firstName} {event.organizer.lastName}</span>
              </p>
            </div> */}
          </div>
          {/* Conditionally render the "Profile artist" and "Link preorder" */}
          {event.artistLink && (
            <div className="mt-4">
              <a href={event.artistLink} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                Link trang cá nhân/blog của artist
              </a>
            </div>
          )}
          <CheckoutButton event={event} />

          {event.hasPreorder === "Yes" && event.url && (
            <div className="mt-4">
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="p-bold-20 text-blue-500">
                Link preorder
              </a>
              <p className="p-medium-16 lg:p-regular-18 mt-4"> {/* Added margin-top to add space */}
                Thời gian mở:
              </p>
              <div className="flex flex-col gap-5">
                <div className='flex gap-2 md:gap-3'>
                  <Image src="/assets/icons/calendar.svg" alt="calendar" width={32} height={32} />
                  <div className="p-medium-16 lg:p-regular-20 flex flex-wrap items-center">
                    <p>
                      {formatDateTime(event.startDateTime).dateOnly} - {' '}
                      {formatDateTime(event.startDateTime).timeOnly}
                    </p>
                    <p>
                      {formatDateTime(event.endDateTime).dateOnly} -  {' '}
                      {formatDateTime(event.endDateTime).timeOnly}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="p-bold-20 text-grey-600">Giới thiệu về gian hàng:</p>
            <p className="p-medium-16 lg:p-regular-18">{event.description}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-3">
              {event.images && event.images.map((image: any) => 
                image.category && image.category.map((cat: ICategory) => (
                  <p
                    key={cat._id}
                    className="p-medium-16 rounded-full bg-grey-500/10 px-4 py-2.5 text-grey-500"
                  >
                    {cat.name}
                  </p>
                ))
              )}
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