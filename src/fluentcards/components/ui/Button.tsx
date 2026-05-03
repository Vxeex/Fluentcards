import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/50 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1": variant === 'default',
            "border-2 border-slate-300 dark:border-slate-600 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100": variant === 'outline',
            "hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-300": variant === 'ghost',
            "bg-rose-100 dark:bg-rose-900/40 text-rose-500 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/60 border-2 border-rose-200 dark:border-rose-800/50": variant === 'destructive',
            "h-11 px-6 py-2": size === 'default',
            "h-9 px-4 text-xs": size === 'sm',
            "h-11 w-11 !rounded-full": size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
