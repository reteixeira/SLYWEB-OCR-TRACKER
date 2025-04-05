import React from "react";
import { Button } from "@/components/ui/button";

// Simplified dropdown menu for use without Radix UI
const DropdownMenu = ({ children }) => {
  return <div>{children}</div>;
};

const DropdownMenuTrigger = ({ asChild, children, ...props }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props);
  }
  return <button {...props}>{children}</button>;
};

const DropdownMenuContent = ({ children, align = "center", ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const alignmentClass = align === "end" ? "right-0" : "left-0";

  return (
    <div
      className={`absolute z-50 mt-2 ${alignmentClass} w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

const DropdownMenuItem = ({ className, children, onClick, ...props }) => {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start rounded-none text-left ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
};

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
export default DropdownMenu;