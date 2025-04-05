import React, { forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DialogPortal = ({ children, className }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">{children}</div>
);

const DialogOverlay = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-100",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = forwardRef(({ className, children, onClose, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay onClick={onClose} />
    <div
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <button
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

// Custom Dialog implementation using useState
const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;
  
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onClose: () => onOpenChange(false) });
        }
        return child;
      })}
    </div>
  );
};

// A simple button that just calls onOpenChange
const DialogTrigger = forwardRef(({ children, onClick, ...props }, ref) => (
  <button ref={ref} onClick={onClick} {...props}>
    {children}
  </button>
));
DialogTrigger.displayName = "DialogTrigger";

// A simple button that closes the dialog
const DialogClose = forwardRef(({ children, onClick, onClose, ...props }, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      if (onClick) onClick(e);
      if (onClose) onClose();
    }}
    {...props}
  >
    {children}
  </button>
));
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

export default Dialog;