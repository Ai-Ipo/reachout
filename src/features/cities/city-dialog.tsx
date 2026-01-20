"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useAuth } from "@clerk/nextjs"

const citySchema = z.object({
    name: z.string().min(1, "Name is required"),
    short_code: z.string().length(3, "Code must be 3 characters").transform((val) => val.toUpperCase()),
})

export function CityDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const { getToken } = useAuth()

    const form = useForm<z.infer<typeof citySchema>>({
        resolver: zodResolver(citySchema),
        defaultValues: {
            name: "",
            short_code: "",
        },
    })

    async function onSubmit(values: z.infer<typeof citySchema>) {
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { error } = await supabase.from("cities").insert({
                name: values.name,
                short_code: values.short_code,
            })

            if (error) throw error

            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error("Error creating city:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add City
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add City</DialogTitle>
                    <DialogDescription>
                        Add a new city location for IPO outreach. Short code is used for ID generation.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Mumbai" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="short_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Short Code (3 Letters)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="MUM"
                                            maxLength={3}
                                            className="uppercase"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Save City</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
