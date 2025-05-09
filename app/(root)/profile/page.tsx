import Collection from '@/components/shared/Collection'
import { Button } from '@/components/ui/button'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { getOrdersByUser, getEventIdsOrderedByUser } from '@/lib/actions/order.actions'
import { IOrder } from '@/lib/database/models/order.model'
import { SearchParamProps } from '@/types'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import React from 'react'

const ProfilePage = async (props: SearchParamProps) => {
  const searchParams = await props.searchParams;
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  const ordersPage = Number(searchParams?.ordersPage) || 1;
  const eventsPage = Number(searchParams?.eventsPage) || 1;

  const orders = await getOrdersByUser({ userId, page: ordersPage })

  const orderedEvents = orders?.data.map((order: IOrder) => order.event) || [];
  const organizedEvents = await getEventsByUser({ userId, page: eventsPage })

  const eventIdsOrdered = await getEventIdsOrderedByUser({ userId })

  return (
    <>
      {/* My Tickets */}
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>Sample đã lưu</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/#events">
              Khám phá thêm nhiều sample khác
            </Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        <Collection 
            data={orders?.data || []}
            emptyTitle="Bạn chưa bookmark sample nào"
            emptyStateSubtext="Có rất nhiều sample đang chờ bạn!"
            collectionType="My_Tickets"
            limit={7}
            page={ordersPage}
            urlParamName="ordersPage"
            totalPages={orders?.totalPages}
          />
      </section>

      {/* Events Organized */}
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>Sample đã đăng</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/events/create">
              Đăng thêm sample
            </Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        <Collection 
          data={organizedEvents?.data}
          emptyTitle="Bạn chưa đăng sample nào cả"
          emptyStateSubtext="Hãy đăng sample nào!"
          collectionType="Events_Organized"
          limit={7}
          page={eventsPage}
          urlParamName="eventsPage"
          totalPages={organizedEvents?.totalPages}
        />
      </section>
    </>
  )
}

export default ProfilePage