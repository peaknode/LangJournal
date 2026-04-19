import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@langjournal/ui/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary-container text-on-primary-container hover:bg-opacity-80 shadow-[0_2px_0_rgba(207,252,0,0.3)] dark:shadow-[0_2px_0_rgba(80,99,0,0.3)]",
        destructive:
          "bg-secondary text-on-secondary hover:bg-opacity-80 focus-visible:ring-secondary/20 dark:focus-visible:ring-secondary/40",
        outline:
          "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-outline-variant",
        secondary:
          "bg-secondary-container text-on-secondary-container hover:bg-opacity-90",
        ghost:
          "hover:bg-surface-container-low text-on-surface",
        link: "text-primary-container underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg text-sm has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-xl px-6 text-base has-[>svg]:px-4",
        xl: "h-12 rounded-[3rem] px-8 text-base has-[>svg]:px-6",
        icon: "size-10 rounded-lg",
        "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
