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
import { Toast } from '../../../multichain';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  IconColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsPerpsInAppToastsEnabled } from '../../../../selectors/perps/feature-flags';

export type PerpsToastVariant = 'info' | 'success' | 'error';

export const PERPS_TOAST_KEYS = {
  CLOSE_FAILED: 'perpsToastCloseFailed',
  CLOSE_IN_PROGRESS: 'perpsToastCloseInProgress',
  MARGIN_ADD_SUCCESS: 'perpsToastMarginAddSuccess',
  MARGIN_REMOVE_SUCCESS: 'perpsToastMarginRemoveSuccess',
  ORDER_FAILED: 'perpsToastOrderFailed',
  ORDER_FILLED: 'perpsToastOrderFilled',
  ORDER_PLACED: 'perpsToastOrderPlaced',
  ORDER_SUBMITTED: 'perpsToastOrderSubmitted',
  SUBMIT_IN_PROGRESS: 'perpsToastSubmitInProgress',
  TRADE_SUCCESS: 'perpsToastTradeSuccess',
  UPDATE_FAILED: 'perpsToastUpdateFailed',
  UPDATE_IN_PROGRESS: 'perpsToastUpdateInProgress',
  UPDATE_SUCCESS: 'perpsToastUpdateSuccess',
} as const;

export type PerpsToastKey =
  (typeof PERPS_TOAST_KEYS)[keyof typeof PERPS_TOAST_KEYS];

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

type PerpsToastIconConfig =
  | {
      className?: string;
      color: IconColor;
      dataTestId: string;
      name: IconName;
      type: 'icon';
    }
  | {
      color: IconColor;
      dataTestId: string;
      name: IconName;
      type: 'spinner';
    }
  | {
      backgroundColor: BackgroundColor;
      className?: string;
      color: TextColor;
      dataTestId: string;
      name: IconName;
      size: AvatarIconSize;
      type: 'avatar-icon';
    };

type PerpsToastPresentation = {
  icon: PerpsToastIconConfig;
  variant: PerpsToastVariant;
};

const PERPS_TOAST_PRESENTATION_BY_VARIANT: Record<
  PerpsToastVariant,
  PerpsToastPresentation
> = {
  error: {
    variant: 'error',
    icon: {
      type: 'icon',
      name: IconName.Warning,
      color: IconColor.errorDefault,
      dataTestId: 'perps-toast-icon-warning',
    },
  },
  info: {
    variant: 'info',
    icon: {
      type: 'spinner',
      name: IconName.Loading,
      color: IconColor.primaryDefault,
      dataTestId: 'perps-toast-icon-loading',
    },
  },
  success: {
    variant: 'success',
    icon: {
      type: 'avatar-icon',
      name: IconName.CheckBold,
      color: TextColor.successDefault,
      backgroundColor: BackgroundColor.successMuted,
      className: 'perps-toast__success-icon',
      size: AvatarIconSize.Md,
      dataTestId: 'perps-toast-icon-check-bold',
    },
  },
};

const PERPS_ORDER_FAILED_PRESENTATION: PerpsToastPresentation = {
  variant: 'error',
  icon: {
    type: 'avatar-icon',
    name: IconName.Warning,
    color: TextColor.errorDefault,
    backgroundColor: BackgroundColor.errorMuted,
    size: AvatarIconSize.Md,
    dataTestId: 'perps-toast-icon-warning',
  },
};

const PERPS_TOAST_PRESENTATION_BY_KEY: Record<
  PerpsToastKey,
  PerpsToastPresentation
> = {
  [PERPS_TOAST_KEYS.CLOSE_FAILED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.error,
  [PERPS_TOAST_KEYS.CLOSE_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.MARGIN_ADD_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.MARGIN_REMOVE_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.ORDER_FAILED]: PERPS_ORDER_FAILED_PRESENTATION,
  [PERPS_TOAST_KEYS.ORDER_FILLED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.ORDER_PLACED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.ORDER_SUBMITTED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.TRADE_SUCCESS]: PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.UPDATE_FAILED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.error,
  [PERPS_TOAST_KEYS.UPDATE_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.UPDATE_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
};

const getToastIcon = ({ icon }: PerpsToastPresentation): ReactNode => {
  if (icon.type === 'spinner') {
    return (
      <Box
        className="perps-toast__loading-spinner-container"
        data-testid={icon.dataTestId}
      >
        <Icon
          name={icon.name}
          size={IconSize.Xl}
          color={icon.color}
          className="animate-spin"
        />
      </Box>
    );
  }

  if (icon.type === 'avatar-icon') {
    return (
      <AvatarIcon
        iconName={icon.name}
        size={icon.size}
        color={icon.color}
        backgroundColor={icon.backgroundColor}
        className={icon.className}
        data-testid={icon.dataTestId}
      />
    );
  }

  return (
    <Icon
      name={icon.name}
      size={IconSize.Xl}
      color={icon.color}
      className={icon.className}
      data-testid={icon.dataTestId}
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

  const upsertPerpsToast = useCallback(
    (config: PerpsToastConfig) => {
      if (!isPerpsInAppToastsEnabled) {
        return;
      }

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
    },
    [isPerpsInAppToastsEnabled],
  );

  const upsertPerpsToastByKey = useCallback(
    (config: PerpsToastKeyConfig) => {
      if (!isPerpsInAppToastsEnabled) {
        return;
      }

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
    [isPerpsInAppToastsEnabled, t],
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
      {isPerpsInAppToastsEnabled && activeToast ? (
        <Box className="toasts-container toasts-container--perps">
          <Toast
            key={activeToast.id}
            startAdornment={getToastIcon(activeToast.presentation)}
            text={activeToast.message}
            description={activeToast.description}
            className="perps-toast"
            contentProps={{ alignItems: AlignItems.center }}
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
