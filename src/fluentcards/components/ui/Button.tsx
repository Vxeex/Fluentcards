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
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar-300 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
          {
            "bg-cinnabar-500 text-white hover:bg-cinnabar-600 shadow-sm": variant === 'default',
            "border-2 border-parchment-200 bg-white hover:bg-cream text-ink-700": variant === 'outline',
            "hover:bg-cinnabar-50 text-ink-500": variant === 'ghost',
            "bg-cinnabar-50 text-cinnabar-600 hover:bg-cinnabar-100 border-2 border-cinnabar-200": variant === 'destructive',
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
