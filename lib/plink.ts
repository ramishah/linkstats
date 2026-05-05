import { createClient } from '@supabase/supabase-js'

const plinkUrl = process.env.PLINK_SUPABASE_URL!
const plinkAnonKey = process.env.PLINK_SUPABASE_ANON_KEY!
const plinkEmail = process.env.PLINK_USER_EMAIL!
const plinkPassword = process.env.PLINK_USER_PASSWORD!

export const plinkMediaServiceUrl = process.env.PLINK_MEDIA_SERVICE_URL!

export const plinkSupabase = createClient(plinkUrl, plinkAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
})

// Cached session
let cachedAccessToken: string | null = null
let tokenExpiresAt: number = 0

export async function getPlinkSession(): Promise<string> {
    const now = Date.now() / 1000
    // Refresh 60s before expiry
    if (cachedAccessToken && tokenExpiresAt > now + 60) {
        return cachedAccessToken
    }

    const { data, error } = await plinkSupabase.auth.signInWithPassword({
        email: plinkEmail,
        password: plinkPassword,
    })

    if (error || !data.session) {
        throw new Error(`Plink auth failed: ${error?.message || 'No session returned'}`)
    }

    cachedAccessToken = data.session.access_token
    tokenExpiresAt = data.session.expires_at ?? (now + 3600)

    return cachedAccessToken
}

export function getAuthenticatedPlinkClient() {
    // Returns a client that will use the cached session
    // Must call getPlinkSession() first to ensure token is cached
    if (!cachedAccessToken) {
        throw new Error('Must call getPlinkSession() before getAuthenticatedPlinkClient()')
    }

    return createClient(plinkUrl, plinkAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${cachedAccessToken}`,
            },
        },
    })
}

// Batch endpoint expects keys all under links/{linkId}/ and returns { urls: { [key]: url } }.
// Service caps each call at 100 keys.
export async function fetchSignedUrlsBatch(
    linkId: string,
    keys: string[],
    accessToken: string,
): Promise<Record<string, string>> {
    if (keys.length === 0) return {}

    const result: Record<string, string> = {}
    const BATCH_SIZE = 100

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const chunk = keys.slice(i, i + BATCH_SIZE)
        const res = await fetch(`${plinkMediaServiceUrl}/media/urls`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ linkId, keys: chunk }),
        })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            throw new Error(`Batch signed URL request failed: ${res.status} ${body}`)
        }

        const json = await res.json()
        Object.assign(result, json.urls ?? {})
    }

    return result
}
