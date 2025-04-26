import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/BaseComponents"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "hover:bg-secondary transition-colors ease-in-out duration-100 rounded-md p-1 h-7 w-7 inline-flex items-center justify-center relative overflow-hidden text-secondary-foreground data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:font-semibold hover:bg-secondary transition-colors ease-in-out duration-100 rounded-md data-[today]:bg-accent data-[today]:text-accent-foreground relative overflow-hidden"
        ),
        day_selected:
          "bg-primary text-primary-foreground font-semibold hover:bg-primary",
        day_disabled: "text-muted-foreground opacity-50",
        day_outside: "text-muted-foreground opacity-50",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="h-4 w-4 stroke-width-2" {...props} />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="h-4 w-4 stroke-width-2" {...props} />
        ),
        ...props.components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
