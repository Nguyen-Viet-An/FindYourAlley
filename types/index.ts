// ====== USER PARAMS
export type CreateUserParams = {
    clerkId: string
    firstName: string | null
    lastName: string | null
    username: string
    email: string
    photo: string
  }
  
  export type UpdateUserParams = {
    firstName: string | null
    lastName: string | null
    username: string
    photo: string
  }
  
  // ====== EVENT PARAMS
  export type CreateEventParams = {
    userId: string;
    event: {
      title: string;
      description: string;
      artistLink?: string;
      images: { imageUrl: string; category: string[] }[]; // Updated images field
      startDateTime: Date;
      endDateTime: Date;
      hasPreorder: string;
      extraTag?: string;
      url?: string;
    };
    path: string;
  };
  
  export type UpdateEventParams = {
    userId: string;
    event: {
      _id: string;
      title: string;
      description: string;
      artistLink?: string;
      images: { imageUrl: string; category: string[] }[]; // Updated images field
      startDateTime: Date;
      endDateTime: Date;
      hasPreorder: string;
      extraTag?: string;
      url?: string;
    };
    path: string;
  };
  export type DeleteEventParams = {
    eventId: string
    path: string
  }
  
  export type GetAllEventsParams = {
    query: string
    fandom: string[]
    itemType: string[]
    hasPreorder?: "Yes" | "No";
    limit: number
    page: number
  }
  
  export type GetEventsByUserParams = {
    userId: string
    limit?: number
    page: number
  }
  
  export type GetRelatedEventsByCategoryParams = {
    categoryIds: string[]
    requestedCategoryIds: string[]
    eventId: string
    limit?: number
    page: number | string
  }
  
  export type Event = {
    _id: string
    title: string
    description: string
    extraTag: string
    imageUrl: string
    artistLink: string
    startDateTime: Date
    endDateTime: Date
    url: string
    organizer: {
      _id: string
      firstName: string
      lastName: string
    }
    category: {
      _id: string
      name: string
      type: string
    }[]
  }
  
  // ====== CATEGORY PARAMS
  export type CreateCategoryParams = {
    categoryName: string
    categoryType: string
  }
  
  // ====== ORDER PARAMS
  export type CheckoutOrderParams = {
    eventTitle: string
    eventId: string
    extraTag: string
    buyerId: string
  }
  
  export type CreateOrderParams = {
    // stripeId: string
    eventId: string
    buyerId: string
    imageIndex?: number;
    // totalAmount: string
    // createdAt: Date
  }
  
  export type GetOrdersByEventParams = {
    eventId: string
    searchString: string
  }
  
  export type GetOrdersByUserParams = {
    userId: string | null
    limit?: number
    page: string | number | null
  }

  export type GetEventIdsOrderedByUserParams = {
    userId: string | null
  }

  export type FindOrderParams = {
    eventId: string;
    userId: string;
    imageIndex?: number;
  }

  export type DeleteOrderParams = {
    orderId: string
  }
  
  // ====== URL QUERY PARAMS
  export type UrlQueryParams = {
    params: string
    key: string
    value: string | null
  }
  
  export type RemoveUrlQueryParams = {
    params: string
    keysToRemove: string[]
  }
  
  export type SearchParamProps = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
  }