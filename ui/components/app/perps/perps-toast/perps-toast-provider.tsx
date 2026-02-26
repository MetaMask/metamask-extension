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
import { useSelector } from 'react-redux';
import { Toast, ToastContainer } from '../../../multichain';
import { Icon, IconName, IconSize } from '../../../component-library';
import { IconColor } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsPerpsInAppToastsEnabled } from '../../../../selectors/perps/feature-flags';

export type PerpsToastVariant = 'info' | 'success' | 'error';

export const PERPS_TOAST_KEYS = {
  CLOSE_FAILED: 'perpsToastCloseFailed',
  CLOSE_IN_PROGRESS: 'perpsToastCloseInProgress',
  ORDER_FAILED: 'perpsToastOrderFailed',
  ORDER_SUBMITTED: 'perpsToastOrderSubmitted',
  SUBMIT_IN_PROGRESS: 'perpsToastSubmitInProgress',
  TRADE_SUCCESS: 'perpsToastTradeSuccess',
  UPDATE_FAILED: 'perpsToastUpdateFailed',
  UPDATE_IN_PROGRESS: 'perpsToastUpdateInProgress',
  UPDATE_SUCCESS: 'perpsToastUpdateSuccess',
} as const;

export type PerpsToastKey =
  (typeof PERPS_TOAST_KEYS)[keyof typeof PERPS_TOAST_KEYS];

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
  messageParams?: unknown[];
};

type PerpsToastState = Omit<PerpsToastConfig, 'variant'> & {
  id: number;
  variant: PerpsToastVariant;
};

type PerpsToastContextValue = {
  hidePerpsToast: () => void;
  replacePerpsToast: (config: PerpsToastConfig) => void;
  replacePerpsToastByKey: (config: PerpsToastKeyConfig) => void;
  showPerpsToast: (config: PerpsToastConfig) => void;
  showPerpsToastByKey: (config: PerpsToastKeyConfig) => void;
};

const DEFAULT_SUCCESS_AUTO_HIDE_TIME = 3000;
const DEFAULT_ERROR_AUTO_HIDE_TIME = 5000;

const noop = () => undefined;
const noopShow = (_config: PerpsToastConfig) => undefined;
const noopShowByKey = (_config: PerpsToastKeyConfig) => undefined;

const PERPS_TOAST_CONTEXT_DEFAULT: PerpsToastContextValue = {
  hidePerpsToast: noop,
  replacePerpsToast: noopShow,
  replacePerpsToastByKey: noopShowByKey,
  showPerpsToast: noopShow,
  showPerpsToastByKey: noopShowByKey,
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

const PERPS_TOAST_VARIANT_BY_KEY: Record<PerpsToastKey, PerpsToastVariant> = {
  [PERPS_TOAST_KEYS.CLOSE_FAILED]: 'error',
  [PERPS_TOAST_KEYS.CLOSE_IN_PROGRESS]: 'info',
  [PERPS_TOAST_KEYS.ORDER_FAILED]: 'error',
  [PERPS_TOAST_KEYS.ORDER_SUBMITTED]: 'info',
  [PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS]: 'info',
  [PERPS_TOAST_KEYS.TRADE_SUCCESS]: 'success',
  [PERPS_TOAST_KEYS.UPDATE_FAILED]: 'error',
  [PERPS_TOAST_KEYS.UPDATE_IN_PROGRESS]: 'info',
  [PERPS_TOAST_KEYS.UPDATE_SUCCESS]: 'success',
};

const getToastIcon = (variant: PerpsToastVariant): ReactNode => {
  if (variant === 'success') {
    return (
      <Icon
        name={IconName.Confirmation}
        size={IconSize.Xl}
        color={IconColor.successDefault}
      />
    );
  }

  if (variant === 'error') {
    return (
      <Icon
        name={IconName.Danger}
        size={IconSize.Xl}
        color={IconColor.errorDefault}
      />
    );
  }

  return (
    <Icon
      name={IconName.Loading}
      size={IconSize.Xl}
      color={IconColor.primaryDefault}
      className="animate-spin"
    />
  );
};

type PerpsToastProviderProps = {
  children: ReactNode;
};

export const PerpsToastProvider = ({ children }: PerpsToastProviderProps) => {
  const t = useI18nContext();
  const isPerpsInAppToastsEnabled = useSelector(getIsPerpsInAppToastsEnabled);
  const [activeToast, setActiveToast] = useState<PerpsToastState | null>(null);
  const toastIdRef = useRef(0);

  const hidePerpsToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  useEffect(() => {
    if (!isPerpsInAppToastsEnabled) {
      setActiveToast(null);
    }
  }, [isPerpsInAppToastsEnabled]);

  const showOrReplacePerpsToast = useCallback(
    (config: PerpsToastConfig) => {
      if (!isPerpsInAppToastsEnabled) {
        return;
      }

      const variant = config.variant ?? 'info';
      const autoHideTime =
        config.autoHideTime ?? getDefaultAutoHideTime(variant);

      toastIdRef.current += 1;

      setActiveToast({
        id: toastIdRef.current,
        ...config,
        autoHideTime,
        variant,
      });
    },
    [isPerpsInAppToastsEnabled],
  );

  const showOrReplacePerpsToastByKey = useCallback(
    (config: PerpsToastKeyConfig) => {
      const { key, messageParams, ...rest } = config;
      const message =
        messageParams && messageParams.length > 0
          ? t(key, messageParams)
          : t(key);

      showOrReplacePerpsToast({
        ...rest,
        message,
        variant: PERPS_TOAST_VARIANT_BY_KEY[key],
      });
    },
    [showOrReplacePerpsToast, t],
  );

  const contextValue = useMemo<PerpsToastContextValue>(
    () => ({
      hidePerpsToast,
      replacePerpsToast: showOrReplacePerpsToast,
      replacePerpsToastByKey: showOrReplacePerpsToastByKey,
      showPerpsToast: showOrReplacePerpsToast,
      showPerpsToastByKey: showOrReplacePerpsToastByKey,
    }),
    [hidePerpsToast, showOrReplacePerpsToast, showOrReplacePerpsToastByKey],
  );

  return (
    <PerpsToastContext.Provider value={contextValue}>
      {children}
      {isPerpsInAppToastsEnabled && activeToast ? (
        <ToastContainer className="toasts-container--perps">
          <Toast
            key={activeToast.id}
            startAdornment={getToastIcon(activeToast.variant)}
            text={activeToast.message}
            description={activeToast.description}
            autoHideTime={activeToast.autoHideTime}
            onClose={hidePerpsToast}
            onAutoHideToast={hidePerpsToast}
            dataTestId={activeToast.dataTestId ?? 'perps-toast'}
          />
        </ToastContainer>
      ) : null}
    </PerpsToastContext.Provider>
  );
};

export const usePerpsToast = () => {
  return useContext(PerpsToastContext);
};
