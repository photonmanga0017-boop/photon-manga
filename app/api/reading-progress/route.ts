// app/api/reading-progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // ใช้ service role key ฝั่งเซิร์ฟเวอร์เท่านั้น (ถ้ายังไม่มี ให้เพิ่มใน .env.local เป็น SUPABASE_SERVICE_ROLE_KEY)
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { mangaId, chapterId, chapterNumber, userId, anonId } = await req.json()

    if (!mangaId || !chapterId || (!userId && !anonId)) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const payload: any = {
      manga_id: mangaId,
      chapter_id: chapterId,
      chapter_number: chapterNumber ?? null,
      updated_at: new Date().toISOString(),
      user_id: userId ?? null,
      anon_id: userId ? null : anonId ?? null,
    }

    const { data, error } = await supabase
      .from('reading_progress')
      .upsert(payload, { ignoreDuplicates: false })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const anonId = searchParams.get('anonId')
    if (!userId && !anonId) {
      return NextResponse.json({ error: 'missing id' }, { status: 400 })
    }
    const col = userId ? 'user_id' : 'anon_id'
    const val = userId ?? anonId

    const { data, error } = await supabase
      .from('reading_progress')
      .select('manga_id, chapter_id, chapter_number, updated_at')
      .eq(col, val)
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
