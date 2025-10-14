import * as React from "react"
import { Check } from "lucide-react"

const Checkbox = React.forwardRef(({ 
  className = "", 
  checked = false, 
  onCheckedChange, 
  disabled = false,
  id,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={`peer h-5 w-5 shrink-0 rounded border-2 glass-checkbox transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => !disabled && onCheckedChange && onCheckedChange(!checked)}
      disabled={disabled}
      {...props}
    >
      {checked && (
        <Check className="h-3.5 w-3.5 text-white" />
      )}
    </button>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
