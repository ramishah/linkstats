"use client"

import { useState } from "react"
import { Plus, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { LinkForm } from "@/components/link-form"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface AddLinkDialogProps {
    friends: any[]
}

export function AddLinkDialog({ friends }: AddLinkDialogProps) {
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
                    <Button className="bg-white text-black hover:bg-zinc-200">
                        <Plus className="mr-2 h-4 w-4" /> Add Link
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl border-zinc-800 bg-zinc-950 p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Log a New Link</DialogTitle>
                    <div className="max-h-[90vh] overflow-y-auto">
                        <LinkForm friends={friends} onSuccess={handleSuccess} />
                    </div>
                </DialogContent>
            </Dialog>

            {showToast && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Alert className="bg-zinc-950 border-zinc-800 text-white text-left">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Link Created</AlertTitle>
                        <AlertDescription>
                            Your link has been successfully logged.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    )
}
