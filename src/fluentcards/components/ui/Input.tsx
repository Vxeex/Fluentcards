import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border-2 border-parchment-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar-300 focus-visible:border-cinnabar-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          "dark:border-sumi-600 dark:bg-sumi-700 dark:text-sumi-50 dark:placeholder:text-sumi-300 dark:focus-visible:ring-cinnabar-700 dark:focus-visible:border-cinnabar-600",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
