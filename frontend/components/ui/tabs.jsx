import * as React from "react"
import { useState } from "react"

const Tabs = ({ value, onValueChange, className = "", children, ...props }) => {
  return (
    <div className={`w-full ${className}`} {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab: value, onTabChange: onValueChange })
      )}
    </div>
  )
}

const TabsList = ({ className = "", children, activeTab, onTabChange, ...props }) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 ${className}`}
      {...props}
    >
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, onTabChange })
      )}
    </div>
  )
}

const TabsTrigger = ({ value, className = "", children, activeTab, onTabChange, disabled = false, ...props }) => {
  const isActive = activeTab === value
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={() => !disabled && onTabChange && onTabChange(value)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, className = "", children, activeTab, ...props }) => {
  if (activeTab !== value) return null
  
  return (
    <div
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
