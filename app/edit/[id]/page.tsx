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
                flop_reason,
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

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditLinkPage({ params }: Props) {
    const { id } = await params
    const link = await getLink(id)
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
