"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-[1100] bg-black/75 backdrop-blur-sm",
        "transition-opacity duration-300 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
        className
      )}
      {...props}
    />
  )
}

/**
 * Bottom sheet on phones, centred card from `sm` up.
 * Enter/exit is driven by base-ui's starting/ending style attributes.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed z-[1101] flex flex-col w-full min-w-0 gap-5 overflow-y-auto overflow-x-hidden border border-line bg-surface text-subhead text-ink shadow-lift outline-none",
          // phone: sheet
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-sheet p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          // tablet+: centred
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sheet sm:p-6",
          "transition-[transform,opacity] duration-[380ms] ease-out",
          "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full data-[ending-style]:duration-200",
          "sm:data-[starting-style]:-translate-y-[46%] sm:data-[starting-style]:scale-95 sm:data-[starting-style]:opacity-0",
          "sm:data-[ending-style]:-translate-y-1/2 sm:data-[ending-style]:scale-95 sm:data-[ending-style]:opacity-0",
          className
        )}
        {...props}
      >
        {/* grabber */}
        <span aria-hidden="true" className="mx-auto -mt-2 mb-1 block h-1 w-10 rounded-full bg-line sm:hidden" />
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-ink-3 transition-colors hover:bg-raised hover:text-ink"
          >
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 pr-10", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("t-display text-title-2 text-ink", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-subhead leading-relaxed text-ink-2", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
