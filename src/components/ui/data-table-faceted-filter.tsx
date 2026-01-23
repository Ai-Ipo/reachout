"use client"

import * as React from "react"
import { PlusCircle, XCircle } from "lucide-react"
import { Column } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>
    title?: string
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const facets = column?.getFacetedUniqueValues()

    // Use local state to force re-renders when selection changes
    const [selected, setSelected] = React.useState<Set<string>>(() => {
        const filterValue = column?.getFilterValue()
        return new Set(
            Array.isArray(filterValue)
                ? filterValue as string[]
                : (typeof filterValue === 'string' ? [filterValue] : [])
        )
    })

    // Sync local state when column filter changes externally (e.g., reset button)
    React.useEffect(() => {
        const filterValue = column?.getFilterValue()
        const newSet = new Set(
            Array.isArray(filterValue)
                ? filterValue as string[]
                : (typeof filterValue === 'string' ? [filterValue] : [])
        )
        setSelected(newSet)
    }, [column?.getFilterValue()])

    const handleToggle = (value: string) => {
        const newSelected = new Set(selected)
        if (newSelected.has(value)) {
            newSelected.delete(value)
        } else {
            newSelected.add(value)
        }
        setSelected(newSelected)
        const filterValues = Array.from(newSelected)
        column?.setFilterValue(filterValues.length ? filterValues : undefined)
    }

    const handleClear = () => {
        setSelected(new Set())
        column?.setFilterValue(undefined)
    }

    const hasFilters = selected.size > 0

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    {hasFilters ? (
                        <XCircle
                            className="mr-2 h-4 w-4 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClear()
                            }}
                        />
                    ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {title}
                    {hasFilters && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selected.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selected.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selected.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selected.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="start">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1.5">
                    {title}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map((option) => {
                    const isSelected = selected.has(option.value)
                    return (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={isSelected}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={() => handleToggle(option.value)}
                        >
                            {option.icon && (
                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            )}
                            <span>{option.label}</span>
                            {facets?.get(option.value) && (
                                <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                                    {facets.get(option.value)}
                                </span>
                            )}
                        </DropdownMenuCheckboxItem>
                    )
                })}
                {selected.size > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={handleClear}
                            className="justify-center text-center text-sm"
                        >
                            Clear filters
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
