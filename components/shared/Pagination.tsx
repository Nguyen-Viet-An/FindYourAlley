"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'
import { Button } from '../ui/button'
import { formUrlQuery } from '@/lib/utils'

type PaginationProps = {
  page: number | string,
  totalPages: number,
  urlParamName?: string
}

const Pagination = ({ page, totalPages, urlParamName }: PaginationProps) => {
  const tp = useTranslations('pagination');
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = Number(page)

  // Function to scroll to the top of the events section
  const scrollToTop = () => {
    const eventsSection = document.getElementById('events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const onClick = (pageNumber: number) => {
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: urlParamName || 'page',
      value: pageNumber.toString(),
      path: window.location.pathname,
    });
    router.push(newUrl, { scroll: false })
    // Scroll to the top of the events section
    scrollToTop()
  }

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      // Show all if pages are few
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Always show first, last, and range around current
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
      <Button
        size="sm"
        variant="outline"
        className="w-16 sm:w-20 text-xs sm:text-sm"
        onClick={() => onClick(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        {tp('previous')}
      </Button>

      {getPageNumbers().map((pageNum, idx) => (
        <Button
          key={idx}
          size="sm"
          variant={pageNum === currentPage ? 'default' : 'outline'}
          className="w-8 sm:w-12 text-xs sm:text-sm"
          onClick={() => typeof pageNum === 'number' && onClick(pageNum)}
          disabled={pageNum === '...'}
        >
          {pageNum}
        </Button>
      ))}

      <Button
        size="sm"
        variant="outline"
        className="w-16 sm:w-20 text-xs sm:text-sm"
        onClick={() => onClick(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        {tp('next')}
      </Button>
    </div>
  )
}

export default Pagination