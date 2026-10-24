import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge the brand type scale (tailwind.config.js fontSize);
// otherwise `text-title-2 text-ink` is read as two colours and the size is dropped.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["large-title", "title-1", "title-2", "title-3", "headline", "body", "callout", "subhead", "footnote", "caption", "micro"] }
      ]
    }
  }
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
