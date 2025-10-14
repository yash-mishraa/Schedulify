import * as React from "react"

const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <textarea
      className={`glass-textarea min-h-[80px] ${className}`}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
