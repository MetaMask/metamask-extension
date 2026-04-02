import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Box } from '@metamask/design-system-react';
import { Toast } from '../../../multichain/toast';
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
};

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
};

const DEFAULT_SUCCESS_AUTO_HIDE_TIME = 3000;
const DEFAULT_ERROR_AUTO_HIDE_TIME = 5000;

const noop = () => undefined;

const PERPS_TOAST_CONTEXT_DEFAULT: PerpsToastContextValue = {
  hidePerpsToast: noop,
  replacePerpsToast: noop,
  replacePerpsToastByKey: noop,
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
  const [activeToast, setActiveToast] = useState<PerpsToastState | null>(null);
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

  const contextValue = useMemo<PerpsToastContextValue>(
    () => ({
      hidePerpsToast,
      replacePerpsToast: upsertPerpsToast,
      replacePerpsToastByKey: upsertPerpsToastByKey,
    }),
    [hidePerpsToast, upsertPerpsToast, upsertPerpsToastByKey],
  );

  return (
    <PerpsToastContext.Provider value={contextValue}>
      {children}
      {activeToast ? (
        <Box className="toasts-container bottom-20 w-[calc(100%-32px)] max-w-[408px]">
          <Toast
            key={activeToast.id}
            startAdornment={getPerpsToastIcon(activeToast.presentation)}
            text={activeToast.message}
            description={activeToast.description}
            className="perps-toast"
            contentProps={{ className: 'items-center' }}
            autoHideTime={activeToast.autoHideTime}
            onClose={hidePerpsToast}
            onAutoHideToast={hidePerpsToast}
            dataTestId={activeToast.dataTestId ?? 'perps-toast'}
          />
        </Box>
      ) : null}
    </PerpsToastContext.Provider>
  );
};

export const usePerpsToast = () => {
  return useContext(PerpsToastContext);
};
