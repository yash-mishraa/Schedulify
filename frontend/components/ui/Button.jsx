import * as React from "react"

const Button = React.forwardRef(({ 
  className = "", 
  variant = "default", 
  size = "default", 
  children, 
  disabled = false,
  type = "button",
  ...props 
}, ref) => {
  const variants = {
    default: "glass-button",
    destructive: "glass-button bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400",
    outline: "glass-button-secondary",
    secondary: "glass-button-secondary",
    ghost: "hover:bg-white/10 text-white transition-all duration-300",
    link: "text-purple-400 underline-offset-4 hover:underline p-0 h-auto",
  }
  
  const sizes = {
    default: "px-6 py-3",
    sm: "px-4 py-2 text-sm",
    lg: "px-8 py-4 text-lg",
    icon: "h-10 w-10 p-0",
  }
  
  const baseClasses = `inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
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
