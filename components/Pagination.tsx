'use client'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
      >
        ก่อนหน้า
      </button>
      <span>หน้า {page} / {totalPages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
      >
        ถัดไป
      </button>
    </div>
  )
}
