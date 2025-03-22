import { IEvent } from '@/lib/database/models/event.model';
import { getBuyerCountForEvent } from '@/lib/actions/order.actions';
import { formatDateTime, isValidUrl } from '@/lib/utils';
import { auth } from "@clerk/nextjs/server";
import Image from 'next/image';
import Link from 'next/link';
import { DeleteConfirmation } from './DeleteConfirmation';
import BookmarkButton from './BookmarkButton';
import CardLightbox from './CardLightbox';

type CardProps = {
  event: IEvent,
  hasOrderLink?: boolean,
  hideEdit?: boolean,
  hidePrice?: boolean,
  hideBookmark?: boolean,
  hasOrdered?: boolean,
  imageIndex?: number
};

type Artist = {
  name: string;
  link?: string;
};

export default async function Card({
  event,
  hasOrderLink,
  hideEdit,
  hideBookmark,
  hasOrdered,
  imageIndex = 0
}: CardProps) {
  // Server-side auth check
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  const isEventCreator = userId === event.organizer?._id?.toString();

  const buyerCount = hasOrderLink ? await getBuyerCountForEvent(event._id) : 0;

  const imageToDisplay = event.images && event.images.length > 0
    ? event.images[imageIndex < event.images.length ? imageIndex : 0]
    : { imageUrl: '', category: [] };

  const displayTitle = imageIndex > 0 ? `${event.title} (Trang ${imageIndex + 1})` : event.title;

  const currentCategory = imageToDisplay.category && imageToDisplay.category.length > 0
    ? imageToDisplay.category[0]
    : null;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg">
       <div className="relative">
        <CardLightbox imageUrl={imageToDisplay.imageUrl || '/assets/images/broken-image.png'} alt={event.title}>
          {/* Only the image is inside the lightbox */}
          <div className="relative">
            {/* You might need to add your image here if it's not already in CardLightbox */}
          </div>
        </CardLightbox>
        
        {/* Then place action buttons outside the lightbox but still positioned absolutely */}
        {!hideBookmark && !isEventCreator && (
          <div className="absolute right-1 top-0.5 z-10">
            <div className="rounded-sm p-1 shadow-sm transition-all">
              <BookmarkButton 
                event={event} 
                hasOrdered={hasOrdered} 
                imageIndex={imageIndex}
              />
            </div>
          </div>
        )}

        {/* Edit & Delete Options for Event Creator */}
        {isEventCreator && !hideEdit && (
          <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
            <Link href={`/events/${event._id}/update`}>
              <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
            </Link>
            <DeleteConfirmation eventId={event._id} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5 md:gap-4">
        {/* <p className="p-medium-16 p-medium-18 text-grey-500">
          {formatDateTime(event.startDateTime).dateTime}
        </p> */}

        <Link href={`/events/${event._id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 text-black">
            {displayTitle}
          </p>
        </Link>

        <div className="flex flex-col gap-2"> {/* Increase gap for better spacing */}
          <div className="flex justify-between items-center">
            {/* Artist Names Column */}
            <p className="p-medium-14 md:p-medium-16 text-grey-600">
              {Array.isArray(event.artists) && event.artists.length > 0
                ? event.artists.map((artist) => artist.name).join(', ') // Join all artist names
                : event.artists?.name || 'No artist information'}
            </p>

            {/* Preorder Link Column */}
            {event.hasPreorder === "Yes" && event.url && isValidUrl(event.url) && (
              <a href={event.url} className="text-primary-500 font-semibold" target="_blank" rel="noopener noreferrer">
                Preorder Link
              </a>
            )}
          </div>

          {/* Bookmark count */}
          {hasOrderLink && (
            <p className="text-primary-500 text-sm">{buyerCount} người đã bookmark</p>
          )}
        </div>
      </div>
    </div>
  );
}