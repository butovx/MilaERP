"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToastPromiseParams<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
};

type ToastType = Omit<ToastProps, "id" | "className" | "children"> & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
  icon?: React.ReactNode;
};

const TOAST_LIMIT = 10;
const TOAST_REMOVE_DELAY = 6000;

type ToasterToast = ToastType & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  createdAt: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  icon?: React.ReactNode;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration = TOAST_REMOVE_DELAY) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    });
  }, duration);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        const toast = state.toasts.find((t) => t.id === toastId);
        const duration = toast?.duration || TOAST_REMOVE_DELAY;
        addToRemoveQueue(toastId, duration);
      } else {
        state.toasts.forEach((toast) => {
          const duration = toast.duration || TOAST_REMOVE_DELAY;
          addToRemoveQueue(toast.id, duration);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id" | "createdAt">;

function toast(props: Toast) {
  const id = genId();
  const duration = props.duration || TOAST_REMOVE_DELAY;

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });
  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
      createdAt: Date.now(),
      duration,
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

toast.success = (props: Omit<ToastType, "variant">) => {
  return toast({
    ...props,
    variant: "success",
  });
};

toast.warning = (props: Omit<ToastType, "variant">) => {
  return toast({
    ...props,
    variant: "warning",
  });
};

toast.error = (props: Omit<ToastType, "variant">) => {
  return toast({
    ...props,
    variant: "destructive",
  });
};

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  const promiseToast = <T>(
    promise: Promise<T>,
    params: ToastPromiseParams<T>
  ) => {
    const id = genId();
    const loadingToast = {
      id,
      title: params.loading,
      variant: "default" as const,
    };

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...loadingToast,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
        },
        createdAt: Date.now(),
      },
    });

    return promise
      .then((data) => {
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: {
            id,
            title:
              typeof params.success === "function"
                ? params.success(data)
                : params.success,
            variant: "success" as const,
          },
        });
        return data;
      })
      .catch((error) => {
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: {
            id,
            title:
              typeof params.error === "function"
                ? params.error(error)
                : params.error,
            variant: "destructive" as const,
          },
        });
        throw error;
      });
  };

  return {
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    toasts: state.toasts,
    promiseToast,
  };
}

export { useToast, toast };
