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
    default: "btn-primary",
    secondary: "btn-secondary", 
    outline: "btn-outline",
    destructive: "btn-primary bg-gradient-to-r from-red-600/80 to-red-500/80 hover:from-red-500/90 hover:to-red-400/90",
    ghost: "hover:bg-white/10 text-white/90 hover:text-white transition-all duration-200",
    link: "text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline p-0 h-auto",
  }
  
  const sizes = {
    default: "px-4 py-2",
    sm: "btn-small",
    lg: "btn-large", 
    icon: "h-9 w-9 p-0",
  }
  
  const baseClasses = `inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`
  
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
