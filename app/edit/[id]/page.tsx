import { getFriends } from "@/lib/data"
import { supabase } from "@/lib/supabase"
import { LinkForm } from "@/components/link-form"
import { notFound } from "next/navigation"

async function getLink(id: string) {
    const { data, error } = await supabase
        .from('links')
        .select(`
      *,
      link_members (
        profile_id,
        is_flop,
        profiles (name)
      )
    `)
        .eq('id', id)
        .single()

    if (error || !data) {
        return null
    }
    return data
}

export default async function EditLinkPage({ params }: { params: { id: string } }) {
    const link = await getLink(params.id)
    const friends = await getFriends()

    if (!link) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold tracking-tight">Edit Link</h2>
            <LinkForm friends={friends} initialData={link} isEdit />
        </div>
    )
}
