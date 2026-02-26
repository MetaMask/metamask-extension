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
import { getIsPerpsInAppToastsEnabled } from '../../../../selectors/perps/feature-flags';

export type PerpsToastVariant = 'info' | 'success' | 'error';

export type PerpsToastConfig = {
  autoHideTime?: number;
  dataTestId?: string;
  description?: string;
  message: string;
  variant?: PerpsToastVariant;
};

type PerpsToastState = Omit<PerpsToastConfig, 'variant'> & {
  id: number;
  variant: PerpsToastVariant;
};

type PerpsToastContextValue = {
  hidePerpsToast: () => void;
  replacePerpsToast: (config: PerpsToastConfig) => void;
  showPerpsToast: (config: PerpsToastConfig) => void;
};

const DEFAULT_SUCCESS_AUTO_HIDE_TIME = 3000;
const DEFAULT_ERROR_AUTO_HIDE_TIME = 5000;

const noop = () => undefined;
const noopShow = (_config: PerpsToastConfig) => undefined;

const PERPS_TOAST_CONTEXT_DEFAULT: PerpsToastContextValue = {
  hidePerpsToast: noop,
  replacePerpsToast: noopShow,
  showPerpsToast: noopShow,
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

  const contextValue = useMemo<PerpsToastContextValue>(
    () => ({
      hidePerpsToast,
      replacePerpsToast: showOrReplacePerpsToast,
      showPerpsToast: showOrReplacePerpsToast,
    }),
    [hidePerpsToast, showOrReplacePerpsToast],
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
