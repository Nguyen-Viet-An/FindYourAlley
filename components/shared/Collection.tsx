import { IEvent } from '@/lib/database/models/event.model';
import React, { useMemo } from 'react';
import Card from './Card';
import Pagination from './Pagination';

type CollectionProps = {
  data: (IEvent | IOrderWithEvent)[];
  ordered?: Array<{ eventId: string; imageIndex?: number }> | string[];
  emptyTitle: string;
  emptyStateSubtext: string;
  limit: number;
  page: number | string;
  totalPages?: number;
  urlParamName?: string;
  collectionType?: 'Events_Organized' | 'My_Tickets' | 'All_Events';
  requestedCategoryIds?: string[];
};

interface IOrderWithEvent {
  _id: string;
  event: IEvent;
  imageIndex?: number;
}

// Define the processed event structure
interface ProcessedEvent {
  event: IEvent;
  hasOrdered: boolean;
  imageIndex?: number;
}

const Collection = ({
  data,
  ordered = [],
  emptyTitle,
  emptyStateSubtext,
  page,
  totalPages = 0,
  collectionType,
  urlParamName,
  requestedCategoryIds = [],
  limit,
}: CollectionProps) => {
  const processedEvents: ProcessedEvent[] = useMemo(() => {
    return data.flatMap((itemOrEvent) => {
      const isOrderItem = 'event' in itemOrEvent && 'imageIndex' in itemOrEvent;
      const event = isOrderItem ? (itemOrEvent as IOrderWithEvent).event : (itemOrEvent as IEvent);
      const imageIndex = isOrderItem ? (itemOrEvent as IOrderWithEvent).imageIndex : undefined;

      if (!event) return [];

      let hasOrdered = false;
      if (Array.isArray(ordered)) {
        if (typeof ordered[0] === 'string') {
          hasOrdered = (ordered as string[]).includes(event._id);
        } else {
          hasOrdered = (ordered as Array<{ eventId: string; imageIndex?: number }>).some(
            (item) => item.eventId === event._id
          );
        }
      }

      // If My_Tickets, only show the specific image
      if (collectionType === 'My_Tickets' && event.images?.length) {
        if (imageIndex !== undefined) {
          return [{ event, imageIndex, hasOrdered }];
        } else {
          // Return all images from the event if imageIndex is not provided
          return event.images.map((image, index) => ({ event, imageIndex: index, hasOrdered }));
        }
      }

      // If filtering by category, only return matching images
      if (requestedCategoryIds.length > 0 && event.images?.length) {
        return event.images
          .map((image, imgIndex) => ({
            event,
            imageIndex: imgIndex,
            hasOrdered,
            matchesCategory: image.category.some((cat) =>
              requestedCategoryIds.includes(cat._id?.toString() || cat.toString())
            ),
          }))
          .filter((item) => item.matchesCategory)
          .map(({ matchesCategory, ...rest }) => rest); // Remove the `matchesCategory` property
      }

      // Otherwise, return all images
      return event.images?.length
        ? event.images.map((_, imgIndex) => ({ event, imageIndex: imgIndex, hasOrdered }))
        : [{ event, hasOrdered }];
    });
  }, [data, ordered, collectionType, requestedCategoryIds]);

  // Determine page size based on images (limit prop now represents images per page)
  const pageNumber = typeof page === 'string' ? parseInt(page, 10) || 1 : page;
  const startIndex = (pageNumber - 1) * limit;
  const endIndex = startIndex + limit;
  const pagedEvents = processedEvents.slice(startIndex, endIndex);
  const totalPagesComputed = totalPages || Math.ceil(processedEvents.length / limit) || 1;

  return (
    <>
      {processedEvents.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
          <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-min">
            {pagedEvents.map(({ event, imageIndex, hasOrdered }) => (
              <li key={`${event._id}-${imageIndex ?? 'default'}`} className="flex justify-center flex-col max-w-xs w-full">
                <Card
                  event={event}
                  hasOrderLink={collectionType === 'Events_Organized'}
                  hideEdit={collectionType === 'All_Events'}
                  hideBookmark={collectionType === 'Events_Organized'}
                  hasOrdered={hasOrdered}
                  imageIndex={imageIndex}
                />
              </li>
            ))}
          </ul>

          {totalPagesComputed > 1 && (
            <Pagination urlParamName={urlParamName} page={page} totalPages={totalPagesComputed} />
          )}
        </div>
      ) : (
        <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 py-28 text-center">
          <h3 className="p-bold-20 md:h5-bold">{emptyTitle}</h3>
          <p className="p-regular-14">{emptyStateSubtext}</p>
        </div>
      )}
    </>
  );
};

export default Collection;
