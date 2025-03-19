import { Schema, model, models, Document } from 'mongoose'

export interface IOrder extends Document {
  // createdAt: Date
  // stripeId: string
  // totalAmount: string
  event: {
    _id: string
    title: string
  }
  buyer: {
    _id: string
    firstName: string
    lastName: string
  }
  imageIndex?: number 
}

export type IOrderItem = {
  // _id: string
  // totalAmount: string
  // createdAt: Date
  eventTitle: string
  eventId: string
  buyer: string
  imageIndex?: number
}

const OrderSchema = new Schema({
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  imageIndex: { type: Number, required: false }, // Add this field
})

const Order = models.Order || model('Order', OrderSchema)

export default Order