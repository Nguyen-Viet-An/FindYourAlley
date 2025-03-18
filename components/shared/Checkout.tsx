import React, { useEffect, useState } from 'react'
import { IEvent } from '@/lib/database/models/event.model'
import { Button } from '../ui/button'
import { createOrder, deleteOrder, findOrder } from '@/lib/actions/order.actions'

const Checkout = ({ 
  event, 
  userId, 
  hasOrdered,
  imageIndex 
}: { 
  event: IEvent, 
  userId: string, 
  hasOrdered?: boolean,
  imageIndex?: number
}) => {
  const [isBookmarked, setIsBookmarked] = useState(hasOrdered);
  
  const onCheckout = async () => {
    if (isBookmarked) {
      const orderId = await findOrder({ 
        eventId: event._id,  
        userId: userId,
        imageIndex: imageIndex
      });
      
      // No need to call deleteOrder as findOrder already deletes the order in your implementation
    } else {
      const order = {
        eventId: event._id,       // Changed from eventId to event to match your schema
        buyerId: userId,          // Changed from buyerId to buyer to match your schema
        imageIndex: imageIndex  // Added imageIndex
      }
      
      await createOrder(order);
    }
    
    setIsBookmarked((prevState) => !prevState);
  }
  
  return (
    <Button
      onClick={onCheckout}
      size="default"
      className="button sm:w-fit text-sm"
    >
      {isBookmarked ? 'Đã lưu' : 'Lưu'}
    </Button>
  )
}

export default Checkout