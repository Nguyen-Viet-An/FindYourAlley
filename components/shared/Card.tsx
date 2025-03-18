import { IEvent } from '@/lib/database/models/event.model';
import { formatDateTime } from '@/lib/utils';
import { auth } from "@clerk/nextjs/server";
import Image from 'next/image';
import Link from 'next/link';
import { DeleteConfirmation } from './DeleteConfirmation';
import CheckoutButton from './CheckoutButton';
import CardLightbox from './CardLightbox';

type CardProps = {
  event: IEvent,
  hasOrderLink?: boolean,
  hidePrice?: boolean,
  hideBookmark?: boolean,
  hasOrdered?: boolean,
  imageIndex?: number
};

export default async function Card({
  event,
  hasOrderLink,
  hidePrice,
  hideBookmark,
  hasOrdered,
  imageIndex = 0
}: CardProps) {
  // Server-side auth check
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  const isEventCreator = userId === event.organizer._id.toString();

  const imageToDisplay = event.images && event.images.length > 0
    ? event.images[imageIndex < event.images.length ? imageIndex : 0]
    : { imageUrl: '', category: [] };

  const displayTitle = imageIndex > 0 ? `${event.title} (Trang ${imageIndex + 1})` : event.title;

  const currentCategory = imageToDisplay.category && imageToDisplay.category.length > 0
    ? imageToDisplay.category[0]
    : null;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg">
      <CardLightbox imageUrl={imageToDisplay.imageUrl || '/assets/images/event-default.png'} alt={event.title}>
        {/* Bookmark Button on Top Left */}
        {!hideBookmark && !isEventCreator && (
          <div className="absolute right-1 top-0.5 z-10">
            <div className="rounded-sm p-1 shadow-sm transition-all">
              <CheckoutButton 
                event={event} 
                hasOrdered={hasOrdered} 
                imageIndex={imageIndex}
              />
            </div>
          </div>
        )}

        {/* Edit & Delete Options for Event Creator */}
        {isEventCreator && (
          <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
            <Link href={`/events/${event._id}/update`}>
              <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
            </Link>
            <DeleteConfirmation eventId={event._id} />
          </div>
        )}
      </CardLightbox>

      <div className="flex flex-col gap-3 p-5 md:gap-4">
        {/* <p className="p-medium-16 p-medium-18 text-grey-500">
          {formatDateTime(event.startDateTime).dateTime}
        </p> */}

        <Link href={`/events/${event._id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 text-black">
            {displayTitle}
          </p>
        </Link>

        <div className="flex-between w-full">
          <p className="p-medium-14 md:p-medium-16 text-grey-600">
            {event.organizer?.firstName} {event.organizer?.lastName}
          </p>
          
          {/* {hasOrderLink && (
            <Link href={`/orders?eventId=${event._id}`} className="flex gap-2">
              <p className="text-primary-500">Order Details</p>
            </Link>
          )} */}
        </div>
      </div>
    </div>
  );
}