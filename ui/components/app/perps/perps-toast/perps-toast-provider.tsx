import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useToaster } from 'react-hot-toast';
import { toast } from '../../../ui/toast/toast';
import {
  type PerpsToastKey,
  type PerpsToastVariant,
} from './perps-toast.constants';
import {
  getPerpsToastIcon,
  PERPS_TOAST_PRESENTATION_BY_KEY,
  PERPS_TOAST_PRESENTATION_BY_VARIANT,
  type PerpsToastPresentation,
} from './perps-toast.presentation';

export { PERPS_TOAST_KEYS } from './perps-toast.constants';
export type { PerpsToastKey, PerpsToastVariant };

export type PerpsToastRouteState = {
  perpsToastKey?: PerpsToastKey;
  perpsToastDescription?: string;
  pendingOrderSymbol?: string;
  pendingOrderFilledDescription?: string;
};

export type PerpsPendingOrder = {
  symbol: string;
  filledDescription?: string;
} | null;

export type PerpsToastConfig = {
  autoHideTime?: number;
  dataTestId?: string;
  description?: string;
  message: string;
  variant?: PerpsToastVariant;
};

export type PerpsToastKeyConfig = Omit<
  PerpsToastConfig,
  'message' | 'variant'
> & {
  key: PerpsToastKey;
  messageParams?: (string | number)[];
};

type PerpsToastState = Omit<PerpsToastConfig, 'variant'> & {
  id: number;
  presentation: PerpsToastPresentation;
};

type PerpsToastContextValue = {
  hidePerpsToast: () => void;
  replacePerpsToast: (config: PerpsToastConfig) => void;
  replacePerpsToastByKey: (config: PerpsToastKeyConfig) => void;
  pendingOrder: PerpsPendingOrder;
  setPendingOrder: (order: PerpsPendingOrder) => void;
};

const DEFAULT_SUCCESS_AUTO_HIDE_TIME = 3000;
const DEFAULT_ERROR_AUTO_HIDE_TIME = 5000;
const PERPS_TOAST_ID = 'perps-toast';

const noop = () => undefined;

const PERPS_TOAST_CONTEXT_DEFAULT: PerpsToastContextValue = {
  hidePerpsToast: noop,
  replacePerpsToast: noop,
  replacePerpsToastByKey: noop,
  pendingOrder: null,
  setPendingOrder: noop,
};

export const PerpsToastContext = createContext<PerpsToastContextValue>(
  PERPS_TOAST_CONTEXT_DEFAULT,
);

const getDefaultAutoHideTime = (
  variant: PerpsToastVariant,
): number | undefined => {
  if (variant === 'success') {
    return DEFAULT_SUCCESS_AUTO_HIDE_TIME;
  }

  if (variant === 'error') {
    return DEFAULT_ERROR_AUTO_HIDE_TIME;
  }

  return undefined;
};

type PerpsToastProviderProps = {
  children: ReactNode;
};

export const PerpsToastProvider = ({ children }: PerpsToastProviderProps) => {
  const t = useI18nContext();
  const { toasts } = useToaster();
  const [activeToast, setActiveToast] = useState<PerpsToastState | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PerpsPendingOrder>(null);
  const toastIdRef = useRef(0);

  const hidePerpsToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const upsertPerpsToast = useCallback((config: PerpsToastConfig) => {
    const variant = config.variant ?? 'info';
    const presentation = PERPS_TOAST_PRESENTATION_BY_VARIANT[variant];
    const autoHideTime =
      config.autoHideTime ?? getDefaultAutoHideTime(presentation.variant);

    toastIdRef.current += 1;

    setActiveToast({
      id: toastIdRef.current,
      ...config,
      autoHideTime,
      presentation,
    });
  }, []);

  const upsertPerpsToastByKey = useCallback(
    (config: PerpsToastKeyConfig) => {
      const { key, messageParams, ...rest } = config;
      const message =
        messageParams && messageParams.length > 0
          ? t(key, messageParams)
          : t(key);
      const presentation = PERPS_TOAST_PRESENTATION_BY_KEY[key];
      const autoHideTime =
        rest.autoHideTime ?? getDefaultAutoHideTime(presentation.variant);

      toastIdRef.current += 1;

      setActiveToast({
        id: toastIdRef.current,
        ...rest,
        autoHideTime,
        message,
        presentation,
      });
    },
    [t],
  );

  useEffect(() => {
    if (!activeToast) {
      toast.remove(PERPS_TOAST_ID);
      return undefined;
    }

    const toastId = activeToast.dataTestId ?? PERPS_TOAST_ID;
    const content = {
      title: activeToast.message,
      description: activeToast.description,
      id: toastId,
    };
    const options = {
      duration: activeToast.autoHideTime ?? Infinity,
      icon: getPerpsToastIcon(activeToast.presentation),
      className: 'perps-toast',
      removeDelay: 0,
    };

    let autoHideTimeoutId: ReturnType<typeof setTimeout> | undefined;
    if (activeToast.autoHideTime) {
      autoHideTimeoutId = setTimeout(hidePerpsToast, activeToast.autoHideTime);
    }

    const { variant } = activeToast.presentation;
    if (variant === 'success') {
      toast.success(content, options);
    } else if (variant === 'error') {
      toast.error(content, options);
    } else {
      toast.loading(content, options);
    }

    return () => {
      if (autoHideTimeoutId) {
        clearTimeout(autoHideTimeoutId);
      }
      toast.remove(toastId);
    };
  }, [activeToast, hidePerpsToast]);

  useEffect(() => {
    if (!activeToast) {
      return;
    }
    const toastId = activeToast.dataTestId ?? PERPS_TOAST_ID;
    const item = toasts.find((entry) => entry.id === toastId);
    if (item?.dismissed) {
      hidePerpsToast();
    }
  }, [activeToast, hidePerpsToast, toasts]);

  const contextValue = useMemo<PerpsToastContextValue>(
    () => ({
      hidePerpsToast,
      replacePerpsToast: upsertPerpsToast,
      replacePerpsToastByKey: upsertPerpsToastByKey,
      pendingOrder,
      setPendingOrder,
    }),
    [
      hidePerpsToast,
      upsertPerpsToast,
      upsertPerpsToastByKey,
      pendingOrder,
      setPendingOrder,
    ],
  );

  return (
    <PerpsToastContext.Provider value={contextValue}>
      {children}
    </PerpsToastContext.Provider>
  );
};

export const usePerpsToast = () => {
  return useContext(PerpsToastContext);
};
