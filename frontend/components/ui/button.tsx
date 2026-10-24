import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-ink bg-transparent text-ink uppercase tracking-[0.22em] hover:bg-ink hover:text-bg",
        outline: "border-line bg-raised text-ink hover:border-ink-3/50 hover:bg-overlay",
        secondary: "bg-raised text-ink hover:bg-overlay",
        ghost: "text-ink-2 hover:bg-raised hover:text-ink",
        destructive: "border-signal/40 bg-signal/10 text-crimson hover:bg-signal/20",
        link: "text-crimson underline-offset-4 hover:underline"
      },
      size: {
        default: "h-12 px-5 text-subhead",
        xs: "h-8 px-2.5 text-micro",
        sm: "h-10 px-3.5 text-footnote",
        lg: "h-14 px-6 text-body",
        icon: "h-11 w-11",
        "icon-xs": "h-8 w-8",
        "icon-sm": "h-10 w-10",
        "icon-lg": "h-14 w-14"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
)

function Button({ className, variant = "default", size = "default", ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
