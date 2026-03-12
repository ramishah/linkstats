import { NextResponse } from 'next/server'
import { getPlinkSession, getAuthenticatedPlinkClient } from '@/lib/plink'

export async function GET() {
    try {
        await getPlinkSession()
        const client = getAuthenticatedPlinkClient()

        const { data, error } = await client
            .from('links')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)

        return NextResponse.json(data ?? [])
    } catch (e: any) {
        console.error('Error fetching plink links:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
