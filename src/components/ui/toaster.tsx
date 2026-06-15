"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast";
// @ts-ignore - had to add ts-ignore because the path might not be found during typechecking
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, InfoIcon, XCircle } from "lucide-react";
import { ReactNode } from "react";

// Define type for toast from hook
type ToastData = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  icon?: React.ReactNode;
  createdAt?: number; // Notification creation time
  duration?: number; // Notification display duration
  onOpenChange?: (open: boolean) => void; // Callback function on open state change
  open?: boolean; // Open state
  [key: string]: any;
};

export function Toaster() {
  // @ts-ignore - temporary ignore for toasts
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        icon,
        createdAt,
        duration,
        onOpenChange,
        open,
        ...props
      }: ToastData) {
        // Icon selection depending on toast variant
        let IconComponent: ReactNode = icon || null;
        if (!IconComponent) {
          switch (variant) {
            case "success":
              IconComponent = (
                <CheckCircle className="h-5 w-5 text-accent-600" />
              );
              break;
            case "warning":
              IconComponent = (
                <AlertCircle className="h-5 w-5 text-warning-600" />
              );
              break;
            case "destructive":
              IconComponent = <XCircle className="h-5 w-5 text-danger-600" />;
              break;
            default:
              IconComponent = <InfoIcon className="h-5 w-5 text-primary-600" />;
              break;
          }
        }

        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="flex gap-3">
              {IconComponent && (
                <div className="flex-shrink-0 pt-1">{IconComponent}</div>
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
