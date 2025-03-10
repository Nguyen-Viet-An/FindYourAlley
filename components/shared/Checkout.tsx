import React, { useEffect, useState } from 'react'
// import { loadStripe } from '@stripe/stripe-js';

import Event from '@/lib/database/models/event.model'
import { IEvent } from '@/lib/database/models/event.model';
import { Button } from '../ui/button';
import { createOrder, deleteOrder, findOrder } from '@/lib/actions/order.actions';

// loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const Checkout = ({ event, userId, hasOrdered}: { event: IEvent, userId: string, hasOrdered?: boolean}) => {
  // useEffect(() => {
  //   // Check to see if this is a redirect back from Checkout
  //   const query = new URLSearchParams(window.location.search);
  //   if (query.get('success')) {
  //     console.log('Order placed! You will receive an email confirmation.');
  //   }

  //   if (query.get('canceled')) {
  //     console.log('Order canceled -- continue to shop around and checkout when you’re ready.');
  //   }
  // }, []);

  const [isBookmarked, setIsBookmarked] = useState(hasOrdered);

  const onCheckout = async () => {
    // have to get order by eventId and userId

    if (isBookmarked) {
      const orderId = await findOrder({ eventId: event._id,  userId: userId});
      console.log(orderId)
      // Call the deleteOrder function if hasOrdered is true
      // await deleteOrder(orderId);
      // await Order.findByIdAndDelete(eventId)
    } else {
      const order = {
        // eventTitle: event.title,
        eventId: event._id,
        // price: event.price,
        // isFree: event.isFree,
        buyerId: userId
      }
      // Call the createOrder function if hasOrdered is false
      await createOrder(order);
    }
    setIsBookmarked((prevState) => !prevState);
    // await createOrder(order);
  }

  return (
    // <form action={onCheckout} method="post">
    //   <Button type="submit" role="link" size="lg" className="button sm:w-fit">
    //     {hasOrdered ? 'Unbookmark' : 'Bookmark'}
    //   </Button>
    // </form>
    <Button
    onClick={onCheckout}
    size="lg"
    className="button sm:w-fit"
    >
      {isBookmarked ? 'Unbookmark' : 'Bookmark'}
  </Button>
  )
}

export default Checkout