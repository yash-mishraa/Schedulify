import * as React from "react"

const Label = React.forwardRef(({ className = "", ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none text-white/90 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
