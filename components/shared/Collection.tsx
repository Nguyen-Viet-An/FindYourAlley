import { IEvent } from '@/lib/database/models/event.model'
import React from 'react'
import Card from './Card'
import Pagination from './Pagination'

type CollectionProps = {
  data: (IEvent | IOrderWithEvent)[],  // Can be either events or orders with events
  ordered?: Array<{eventId: string, imageIndex?: number}> | string[],  // Updated to handle both formats
  emptyTitle: string,
  emptyStateSubtext: string,
  limit: number,
  page: number | string,
  totalPages?: number,
  urlParamName?: string,
  collectionType?: 'Events_Organized' | 'My_Tickets' | 'All_Events',
  requestedCategoryIds?: string[]
}

// Define a new interface for order with event
interface IOrderWithEvent {
  _id: string;
  event: IEvent;
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
}: CollectionProps) => {
  return (
    <>
      {data.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
          <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-min">
            {data.map((itemOrEvent) => {
              // Determine if we're dealing with an order object or a direct event
              const isOrderItem = 'event' in itemOrEvent && 'imageIndex' in itemOrEvent;
              const event = isOrderItem ? (itemOrEvent as IOrderWithEvent).event : (itemOrEvent as IEvent);
              const imageIndex = isOrderItem ? (itemOrEvent as IOrderWithEvent).imageIndex : undefined;
            
              if (!event) return null; // <-- Add this early bail-out
            
              const hasOrderLink = collectionType === 'Events_Organized';
              const hideBookmark = collectionType === 'Events_Organized';
              const hideEdit = collectionType === 'All_Events';
              let hasOrdered = false;
              
              if (Array.isArray(ordered)) {
                if (ordered.length > 0 && typeof ordered[0] === 'string') {
                  hasOrdered = (ordered as string[]).includes(event._id);
                } else if (ordered.length > 0 && typeof ordered[0] === 'object') {
                  hasOrdered = (ordered as Array<{ eventId: string; imageIndex?: number }>).some(
                    (item) => item.eventId === event._id
                  );
                }
              }
            
              
              // For My_Tickets with imageIndex, only show the specific image
              if (collectionType === 'My_Tickets' && imageIndex !== undefined && event.images?.length > 0) {
                return (
                  <li key={`${event._id}-${imageIndex}`} className="flex justify-center flex-col max-w-xs w-full">
                    <Card
                      event={event}
                      hasOrderLink={hasOrderLink}
                      hideBookmark={hideBookmark}
                      hasOrdered={true}
                      imageIndex={imageIndex}
                    />
                  </li>
                );
              } else if (requestedCategoryIds.length > 0 && event.images?.length > 0) {
                return event.images
                  .map((image, imgIndex) => {
                    const hasMatchingCategory = image.category.some((cat) =>
                      requestedCategoryIds.includes(cat._id?.toString() || cat.toString())
                    );
                    if (hasMatchingCategory) {
                      return (
                        <li key={`${event._id}-${imgIndex}`} className="flex justify-center flex-col max-w-xs w-full">
                          <Card
                            event={event}
                            hasOrderLink={hasOrderLink}
                            hideBookmark={hideBookmark}
                            hasOrdered={hasOrdered}
                            imageIndex={imgIndex}
                          />
                        </li>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean);
              } else if (event.images?.length > 0) {
                return event.images.map((_, imgIndex) => (
                  <li key={`${event._id}-${imgIndex}`} className="flex justify-center flex-col max-w-xs w-full">
                    <Card
                      event={event}
                      hasOrderLink={hasOrderLink}
                      hideEdit={hideEdit}
                      hideBookmark={hideBookmark}
                      hasOrdered={hasOrdered}
                      imageIndex={imgIndex}
                    />
                  </li>
                ));
              } else {
                return (
                  <li key={event._id} className="flex justify-center flex-col max-w-xs w-full">
                    <Card event={event} hasOrderLink={hasOrderLink} hideBookmark={hideBookmark} hasOrdered={hasOrdered} />
                  </li>
                );
              }
            })}
          </ul>

          {totalPages > 1 && (
            <Pagination urlParamName={urlParamName} page={page} totalPages={totalPages} />
          )}
        </div>
      ) : (
        <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 py-28 text-center">
          <h3 className="p-bold-20 md:h5-bold">{emptyTitle}</h3>
          <p className="p-regular-14">{emptyStateSubtext}</p>
        </div>
      )}
    </>
  )
}
export default Collection