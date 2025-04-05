import * as React from "react"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <label 
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input cursor-pointer",
      className
    )}
  >
    <input
      type="checkbox"
      className="absolute opacity-0 w-0 h-0"
      ref={ref}
      {...props}
    />
    <span 
      className={cn(
        "pointer-events-none absolute h-5 w-5 rounded-full bg-background shadow-lg transform ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        props.checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </label>
))
Switch.displayName = "Switch"

export { Switch }
export default Switch