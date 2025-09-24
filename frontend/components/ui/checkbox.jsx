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
      className={`peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked 
          ? 'bg-blue-600 text-white border-blue-600' 
          : 'bg-white hover:bg-gray-50'
      } ${className}`}
      onClick={() => !disabled && onCheckedChange && onCheckedChange(!checked)}
      disabled={disabled}
      {...props}
    >
      {checked && (
        <Check className="h-3 w-3 text-white" />
      )}
    </button>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
