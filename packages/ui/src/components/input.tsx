import * as React from "react"

import { cn } from "@langjournal/ui/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[2rem] bg-surface-container-lowest px-4 py-2 text-base font-medium transition-all outline-none selection:bg-primary-container selection:text-on-primary-container file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-on-surface placeholder:text-outline-variant disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
        "focus-visible:ring-[4px] focus-visible:ring-primary/20",
        "aria-invalid:ring-[4px] aria-invalid:ring-secondary/20 dark:aria-invalid:ring-secondary/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
