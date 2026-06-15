import { Transition } from "@headlessui/react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast, { Toast as ToastType } from "react-hot-toast";

const DEFAULT_TOAST_DURATION = 3000;

type ToastProps = {
  t: ToastType;
  message: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
};

const Toast = ({ t, message, description, type = "info" }: ToastProps) => {
  const isSuccess = type === "success";
  const isError = type === "error";
  const isWarning = type === "warning";
  const isInfo = type === "info";

  const iconMap = {
    success: <CheckCircleIcon className="h-6 w-6 text-accent-500" />,
    error: <XCircleIcon className="h-6 w-6 text-danger-500" />,
    warning: <ExclamationCircleIcon className="h-6 w-6 text-warning-500" />,
    info: <InformationCircleIcon className="h-6 w-6 text-primary-500" />,
  };

  return (
    <Transition
      show={t.visible}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto border border-gray-100">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">{iconMap[type]}</div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{message}</p>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={() => toast.dismiss(t.id)}
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};

export const showSuccessToast = (message: string, description?: string) => {
  return toast.custom(
    (t) => (
      <Toast t={t} message={message} description={description} type="success" />
    ),
    { duration: DEFAULT_TOAST_DURATION }
  );
};

export const showErrorToast = (message: string, description?: string) => {
  return toast.custom(
    (t) => (
      <Toast t={t} message={message} description={description} type="error" />
    ),
    { duration: DEFAULT_TOAST_DURATION }
  );
};

export const showInfoToast = (message: string, description?: string) => {
  return toast.custom(
    (t) => (
      <Toast t={t} message={message} description={description} type="info" />
    ),
    { duration: DEFAULT_TOAST_DURATION }
  );
};

export const showWarningToast = (message: string, description?: string) => {
  return toast.custom(
    (t) => (
      <Toast t={t} message={message} description={description} type="warning" />
    ),
    { duration: DEFAULT_TOAST_DURATION }
  );
};
