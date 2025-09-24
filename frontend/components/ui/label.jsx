import * as React from "react"

const Label = React.forwardRef(({ className = "", htmlFor, ...props }, ref) => (
  <label
    ref={ref}
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none text-gray-700 ${className}`}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
