import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldClass } from "./input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClass, "flex min-h-[96px] resize-none py-3 leading-relaxed", className)}
      {...props}
    />
  )
}

export { Textarea }
