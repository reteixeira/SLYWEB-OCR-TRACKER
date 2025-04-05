import * as React from "react"

const ScrollArea = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={`relative overflow-auto ${className}`} {...props}>
      {children}
    </div>
  )
})
ScrollArea.displayName = "ScrollArea"

const ScrollBar = React.forwardRef(({ orientation = "vertical", className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex touch-none select-none transition-colors ${
        orientation === "horizontal" 
          ? "h-2.5 border-t border-t-transparent p-[1px]" 
          : "w-2.5 border-l border-l-transparent p-[1px]"
      } ${className}`}
      {...props}
    >
      <div className="relative flex-1 rounded-full bg-border" />
    </div>
  )
})
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }

// Adicionar export default
export default ScrollArea;