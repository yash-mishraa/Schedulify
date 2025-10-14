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
      className={`glass-tabs inline-flex h-12 items-center justify-center text-white/80 ${className}`}
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
      className={`glass-tab ${isActive ? 'glass-tab-active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
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
      className={`mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
