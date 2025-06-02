// A reusable Button component following shadcn/ui style architecture
// This is a simplified version for demonstration purposes

import React from 'react'
import { cn } from '../../lib/utils'

// Define button variants
const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white",
  outline: "bg-transparent hover:bg-slate-100 border border-slate-300 text-slate-800"
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: 'sm' | 'md' | 'lg'
}

// Button component with Tailwind styling
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    // Size classes
    const sizeClasses = {
      sm: "py-1 px-3 text-sm",
      md: "py-2 px-4 text-base",
      lg: "py-3 px-6 text-lg"
    }

    return (
      <button
        className={cn(
          "font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
          buttonVariants[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
