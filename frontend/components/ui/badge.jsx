import * as React from "react"

const Badge = ({ className = "", variant = "default", children, ...props }) => {
  const variants = {
    default: "glass-badge",
    secondary: "glass-badge bg-gradient-to-r from-gray-500/30 to-gray-400/30",
    destructive: "glass-badge bg-gradient-to-r from-red-500/30 to-red-400/30",
    outline: "glass-badge bg-transparent border-2",
  }

  return (
    <div
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { Badge }
