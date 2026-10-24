import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/** 16px text on mobile prevents iOS zoom-on-focus. */
export const fieldClass =
  "w-full min-w-0 rounded-xl border border-line bg-raised px-3.5 text-callout text-ink transition-[border-color,box-shadow,background-color] duration-150 outline-none placeholder:text-ink-3 hover:border-ink-3/40 focus-visible:bg-overlay disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-signal sm:text-subhead"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        fieldClass,
        "h-12 [color-scheme:dark] file:mr-3 file:border-0 file:bg-transparent file:text-subhead file:font-medium file:text-ink",
        className
      )}
      {...props}
    />
  )
}

export { Input }
