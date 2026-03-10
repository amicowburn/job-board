'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  searchParams?: Record<string, string | undefined>
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null

  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value)
      }
    })
    params.set('page', String(page))
    return `${baseUrl}?${params.toString()}`
  }

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {/* Previous button */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className={cn(
            'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
            'border border-border bg-background hover:bg-muted transition-colors'
          )}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Prev
        </Link>
      ) : (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
            'border border-border bg-background opacity-50 cursor-not-allowed'
          )}
          aria-disabled="true"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Prev
        </span>
      )}

      {/* Page numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={buildUrl(page)}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium min-w-[40px]',
                'border transition-colors',
                page === currentPage
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Mobile: show current page indicator */}
      <span className="sm:hidden px-3 py-2 text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next button */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className={cn(
            'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
            'border border-border bg-background hover:bg-muted transition-colors'
          )}
          aria-label="Next page"
        >
          Next
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Link>
      ) : (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
            'border border-border bg-background opacity-50 cursor-not-allowed'
          )}
          aria-disabled="true"
        >
          Next
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </span>
      )}
    </nav>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}
