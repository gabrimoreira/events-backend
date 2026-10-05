import type { Paginated } from '../types'

export function paginate<T>(items: T[], page = 1, pageSize = 10): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  }
}

export function pageWindow(page = 1, pageSize = 10) {
  const safePage = Math.max(page, 1)
  return {
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    toPaginated<T>(items: T[], total: number): Paginated<T> {
      return {
        items,
        page: safePage,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    },
  }
}
