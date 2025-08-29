'use client'
import { useState } from 'react'

export default function MangaFilters({ onFilter }: { onFilter: (filters: any) => void }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('updated_desc')

  const applyFilters = () => {
    onFilter({ search, status, sort })
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="ค้นหา..."
        className="px-2 py-1 rounded bg-gray-700"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        className="px-2 py-1 rounded bg-gray-700"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">ทุกสถานะ</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
      </select>
      <select
        className="px-2 py-1 rounded bg-gray-700"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="updated_desc">อัปเดตล่าสุด</option>
        <option value="title_asc">ชื่อ A→Z</option>
        <option value="title_desc">ชื่อ Z→A</option>
      </select>
      <button
        className="px-3 py-1 bg-blue-500 rounded text-white"
        onClick={applyFilters}
      >
        ใช้
      </button>
    </div>
  )
}
