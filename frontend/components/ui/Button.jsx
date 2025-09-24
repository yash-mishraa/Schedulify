import * as React from "react"

const Button = React.forwardRef(({ 
  className = "", 
  variant = "default", 
  size = "default", 
  children, 
  disabled = false,
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm"
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
    link: "text-blue-600 underline-offset-4 hover:underline p-0 h-auto shadow-none",
  }
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`
  
  return (
    <button
      className={classes}
      ref={ref}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = "Button"

export { Button }
