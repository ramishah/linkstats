"use client"

import { useState } from "react"
import { Pencil, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { LinkForm } from "@/components/link-form"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface EditLinkDialogProps {
    link: any
    friends: any[]
}

export function EditLinkDialog({ link, friends }: EditLinkDialogProps) {
    const [open, setOpen] = useState(false)
    const [showToast, setShowToast] = useState(false)

    const handleSuccess = () => {
        setOpen(false)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl border-zinc-800 bg-zinc-950 p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Edit Link</DialogTitle>
                    <div className="max-h-[90vh] overflow-y-auto">
                        <LinkForm friends={friends} initialData={link} isEdit={true} onSuccess={handleSuccess} />
                    </div>
                </DialogContent>
            </Dialog>

            {showToast && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Alert className="bg-zinc-950 border-zinc-800 text-white text-left">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Link Edited</AlertTitle>
                        <AlertDescription>
                            The link has been successfully updated.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    )
}
