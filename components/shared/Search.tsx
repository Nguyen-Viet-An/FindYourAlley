"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';

const Search = ({ placeholder = 'Tìm theo tên gian/artist/couple...' }: { placeholder?: string }) => {
  const [query, setQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const delayDebounceFn = setTimeout(() => {
      let newUrl = '';

      // Only perform search if query is meaningful (more than 2 characters)
      if (query && query.trim().length >= 2) {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'query',
          value: query
        });
      } else {
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ['query']
        });
      }

      router.push(newUrl, { scroll: false });
    }, 300); // Maintain original 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchParams, router, isClient]);

  if (!isClient) {
    return null; // or a placeholder
  }

  return (
    <div className="flex-center min-h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
      <Image src="/assets/icons/search.svg" alt="search" width={24} height={24} />
      <Input 
        type="text"
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        className="p-regular-16 border-0 bg-grey-50 outline-offset-0 placeholder:text-grey-500 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
};

export default Search;