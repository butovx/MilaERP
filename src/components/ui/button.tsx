import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover)] shadow-sm hover:shadow-md hover:shadow-indigo-500/10",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-sm",
        outline:
          "border border-[var(--card-border)] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-color-primary)] shadow-sm",
        secondary:
          "bg-black/5 dark:bg-white/5 text-[var(--text-color-primary)] hover:bg-black/10 dark:hover:bg-white/10 shadow-sm",
        ghost: "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-color-primary)]",
        link: "text-indigo-500 dark:text-indigo-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-base",
        icon: "h-9 w-9",
        mobile: "min-h-[44px] h-auto py-2 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  fullWidthMobile?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      fullWidthMobile = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? "button" : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidthMobile && "w-full sm:w-auto"
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
