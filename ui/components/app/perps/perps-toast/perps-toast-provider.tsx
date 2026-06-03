import { toast } from '@metamask/design-system-react';
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

const getToastSeverity = (variant: PerpsToastVariant) => {
  if (variant === 'info') {
    return 'default';
  }

  if (variant === 'error') {
    return 'danger';
  }

  return 'success';
};

type PerpsToastProviderProps = {
  children: ReactNode;
};

export const PerpsToastProvider = ({ children }: PerpsToastProviderProps) => {
  const t = useI18nContext();
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
    if (activeToast) {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      if (activeToast.autoHideTime === undefined) {
        timeoutId = undefined;
      } else {
        timeoutId = setTimeout(() => {
          hidePerpsToast();
        }, activeToast.autoHideTime);
      }

      toast({
        severity: getToastSeverity(activeToast.presentation.variant),
        title: activeToast.message,
        description: activeToast.description,
        startAccessory: getPerpsToastIcon(activeToast.presentation),
        className: 'perps-toast',
        'data-testid': activeToast.dataTestId ?? 'perps-toast',
        hasNoTimeout: true,
        onClose: hidePerpsToast,
      });

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        toast.dismiss();
      };
    }

    return undefined;
  }, [activeToast, hidePerpsToast]);

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
