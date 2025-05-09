"use client";

import { IEvent } from '@/lib/database/models/event.model';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react';
import { Button } from '../ui/button';
import Bookmark from './Bookmark';

type BookmarkButtonProps = {
  event: IEvent;
  hasOrdered?: boolean; // New prop for checking order status
  imageIndex?: number;
};

const BookmarkButton = ({ 
  event, 
  hasOrdered, 
  imageIndex 
}: BookmarkButtonProps) => {
  const { user } = useUser();
  const userId = user?.publicMetadata.userId as string;
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  return (
    <div className="flex items-center gap-0.5"> {/* Reduced gap for a smaller layout */}
      <>
        {/* <SignedOut>
          <Button asChild className="button rounded-full px-0 py-0 text-sm" size="sm"> {/* Smaller padding and text */}
            {/* <Link href="/sign-in">
              Get Tickets
            </Link>
          </Button>
        </SignedOut> */} 
        <SignedIn>
          <Bookmark 
            event={event} 
            userId={userId} 
            hasOrdered={hasOrdered}
            imageIndex={imageIndex}
          />
        </SignedIn>
      </>
    </div>
  );
}

export default BookmarkButton;