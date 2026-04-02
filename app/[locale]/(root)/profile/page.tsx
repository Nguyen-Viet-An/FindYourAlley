import Collection from '@/components/shared/Collection'
import ExportBookmarks from '@/components/shared/ExportBookmarks'
import ExportTrades from '@/components/shared/ExportTrades'
import NotificationSettings from '@/components/shared/NotificationSettings'
import { Button } from '@/components/ui/button'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { getOrdersByUser, getEventIdsOrderedByUser, getAllBookmarksByUser } from '@/lib/actions/order.actions'
import { getOcCardsByUser } from '@/lib/actions/ocCard.actions'
import { getTradeCountForCard, getAcceptedTradesForUser } from '@/lib/actions/tradeRequest.actions'
import { IOrder } from '@/lib/database/models/order.model'
import { SearchParamProps } from '@/types'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import React from 'react'
import OcCardItem from '@/components/shared/OcCardItem'
import { getTranslations } from 'next-intl/server';

const ProfilePage = async (props: SearchParamProps) => {
  const searchParams = await props.searchParams;
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  const ordersPage = Number(searchParams?.ordersPage) || 1;
  const eventsPage = Number(searchParams?.eventsPage) || 1;

  const [orders, organizedEvents, allBookmarks, myOcCards, acceptedTrades] = await Promise.all([
    getOrdersByUser({ userId, page: ordersPage }),
    getEventsByUser({ userId, page: eventsPage }),
    getAllBookmarksByUser(userId),
    getOcCardsByUser(userId),
    getAcceptedTradesForUser(userId),
  ]);
  const t = await getTranslations('profile');

  // Flatten OC cards into per-image items with per-image trade counts
  const ocFlatItems: { card: any; imageIndex: number }[] = [];
  (myOcCards || []).forEach((card: any) => {
    if (card.images && card.images.length > 0) {
      card.images.forEach((_: any, ii: number) => {
        ocFlatItems.push({ card, imageIndex: ii });
      });
    } else {
      ocFlatItems.push({ card, imageIndex: 0 });
    }
  });

  const ocCardExtras = await Promise.all(
    ocFlatItems.map(async (item) => {
      const tradeCount = await getTradeCountForCard(item.card._id, item.imageIndex);
      return { tradeCount };
    })
  );

  const eventIdsOrdered = await getEventIdsOrderedByUser({ userId })

  return (
    <>
      {/* My Tickets */}
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>{t('savedSamples')}</h3>
          <div className="hidden sm:flex gap-3 items-center">
            <ExportBookmarks bookmarks={allBookmarks} />
            <Button asChild size="lg" className="button">
              <Link href="/#events">
                {t('exploreMore')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="wrapper my-8">
        <Collection
            data={orders?.data || []}
            emptyTitle={t('noBookmarks')}
            emptyStateSubtext={t('noBookmarksHint')}
            collectionType="My_Tickets"
            limit={10}
            page={ordersPage}
            urlParamName="ordersPage"
            totalPages={orders?.totalPages}
          />
      </section>

      {/* Events Organized */}
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>{t('postedSamples')}</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/events/create">
              {t('postMore')}
            </Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        <Collection
          data={organizedEvents?.data}
          emptyTitle={t('noSamples')}
          emptyStateSubtext={t('noSamplesHint')}
          collectionType="Events_Organized"
          limit={10}
          page={eventsPage}
          urlParamName="eventsPage"
          totalPages={organizedEvents?.totalPages}
        />
      </section>

      {/* OC Cards */}
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>{t('yourOcCards')}</h3>
          <div className="hidden sm:flex gap-3 items-center">
            <Link href="/profile/trade-requests" className="text-sm text-primary-500 hover:underline font-medium">
              {t('manageTradeRequests')}
            </Link>
            <Button asChild size="lg" className="button">
              <Link href="/oc-cards/create">
                {t('postOcCard')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="wrapper my-8">
        {ocFlatItems.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {ocFlatItems.map((item, index) => (
              <div key={`${item.card._id}-${item.imageIndex}`} className="break-inside-avoid">
                <OcCardItem
                  card={item.card}
                  imageIndex={item.imageIndex}
                  tradeCount={ocCardExtras[index].tradeCount}
                  userId={userId}
                  isOwner={true}
                  alreadyRequested={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-center min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 dark:bg-muted py-28 text-center">
            <h3 className="p-bold-20 md:h5-bold">{t('noOcCards')}</h3>
            <p className="p-regular-14">{t('noOcCardsHint')}</p>
          </div>
        )}
      </section>

      {/* Accepted Trades */}
      {(acceptedTrades.asRequester.length > 0 || acceptedTrades.asOwner.length > 0) && (
        <>
          <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
            <div className="wrapper flex items-center justify-center sm:justify-between">
              <h3 className='h3-bold text-center sm:text-left'>{t('tradedCards')}</h3>
              <div className="hidden sm:flex">
                <ExportTrades asRequester={acceptedTrades.asRequester} asOwner={acceptedTrades.asOwner} />
              </div>
            </div>
          </section>

          <section className="wrapper my-8">
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {/* Cards you requested and got accepted */}
              {acceptedTrades.asRequester.map((trade: any) => {
                const cardImage = trade.card?.images?.[trade.imageIndex ?? 0];
                return cardImage?.imageUrl ? (
                  <div key={`req-${trade._id}`} className="break-inside-avoid">
                    <OcCardItem
                      card={trade.card}
                      imageIndex={trade.imageIndex ?? 0}
                      tradeCount={{ total: 0, accepted: 0 }}
                      userId={userId}
                      isOwner={false}
                      alreadyRequested={true}
                      requestStatus="accepted"
                    />
                  </div>
                ) : null;
              })}
              {/* Cards offered to you (as owner) via linkedCard */}
              {acceptedTrades.asOwner.map((trade: any) => {
                if (!trade.linkedCard?.images?.[0]?.imageUrl) return null;
                return (
                  <div key={`own-${trade._id}`} className="break-inside-avoid">
                    <OcCardItem
                      card={trade.linkedCard}
                      imageIndex={0}
                      tradeCount={{ total: 0, accepted: 0 }}
                      userId={userId}
                      isOwner={false}
                      alreadyRequested={false}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Notification Settings */}
      <section className="wrapper my-8">
        <NotificationSettings userId={userId} />
      </section>
    </>
  )
}

export default ProfilePage