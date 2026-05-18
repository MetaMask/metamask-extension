import React, { type ReactNode } from 'react';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  Box,
  Icon,
  IconColor,
  IconName,
  type IconProps,
  IconSize,
} from '@metamask/design-system-react';
import {
  PERPS_TOAST_KEYS,
  type PerpsToastKey,
  type PerpsToastVariant,
} from './perps-toast.constants';

export type PerpsToastIconConfig =
  | {
      color: IconColor;
      dataTestId: string;
      name: IconName;
      type: 'spinner';
    }
  | {
      className?: string;
      dataTestId: string;
      iconProps?: Omit<IconProps, 'name'>;
      name: IconName;
      severity: AvatarIconSeverity;
      size: AvatarIconSize;
      type: 'avatar-icon';
    };

export type PerpsToastPresentation = {
  icon: PerpsToastIconConfig;
  variant: PerpsToastVariant;
};

export const PERPS_TOAST_PRESENTATION_BY_VARIANT: Record<
  PerpsToastVariant,
  PerpsToastPresentation
> = {
  error: {
    variant: 'error',
    icon: {
      type: 'avatar-icon',
      name: IconName.Warning,
      severity: AvatarIconSeverity.Error,
      size: AvatarIconSize.Md,
      dataTestId: 'perps-toast-icon-warning',
    },
  },
  info: {
    variant: 'info',
    icon: {
      type: 'spinner',
      name: IconName.Loading,
      color: IconColor.PrimaryDefault,
      dataTestId: 'perps-toast-icon-loading',
    },
  },
  success: {
    variant: 'success',
    icon: {
      type: 'avatar-icon',
      name: IconName.CheckBold,
      severity: AvatarIconSeverity.Success,
      className: 'perps-toast__success-icon',
      iconProps: {
        // Preserve pre-DS perps success icon contrast.
        style: {
          color: 'var(--color-accent03-dark)',
        },
      },
      size: AvatarIconSize.Md,
      dataTestId: 'perps-toast-icon-check-bold',
    },
  },
};

const PERPS_ERROR_PRESENTATION: PerpsToastPresentation = {
  variant: 'error',
  icon: {
    type: 'avatar-icon',
    name: IconName.Warning,
    severity: AvatarIconSeverity.Error,
    size: AvatarIconSize.Md,
    dataTestId: 'perps-toast-icon-warning',
  },
};

export const PERPS_TOAST_PRESENTATION_BY_KEY: Record<
  PerpsToastKey,
  PerpsToastPresentation
> = {
  [PERPS_TOAST_KEYS.CANCEL_ORDER_FAILED]: PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.INCREASE_POSITION_CROSS_MARGIN_BLOCKED]:
    PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.CANCEL_ORDER_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.CLOSE_FAILED]: PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.CLOSE_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.MARGIN_ADD_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.MARGIN_ADJUSTMENT_FAILED]: PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.MARGIN_REMOVE_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.ORDER_FAILED]: PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.PARTIAL_CLOSE_FAILED]: PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.PARTIAL_CLOSE_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.PARTIAL_CLOSE_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.REVERSE_FAILED]: PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.REVERSE_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.REVERSE_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.ORDER_FILLED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.ORDER_PLACED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.ORDER_SUBMITTED]: PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.TRADE_SUCCESS]: PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
  [PERPS_TOAST_KEYS.UPDATE_FAILED]: PERPS_ERROR_PRESENTATION,
  [PERPS_TOAST_KEYS.UPDATE_IN_PROGRESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.info,
  [PERPS_TOAST_KEYS.UPDATE_SUCCESS]:
    PERPS_TOAST_PRESENTATION_BY_VARIANT.success,
};

export const getPerpsToastIcon = ({
  icon,
}: PerpsToastPresentation): ReactNode => {
  if (icon.type === 'spinner') {
    return (
      <Box
        className="flex h-8 w-8 items-center justify-center"
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

  return (
    <AvatarIcon
      iconName={icon.name}
      size={icon.size}
      severity={icon.severity}
      iconProps={icon.iconProps}
      className={icon.className}
      data-testid={icon.dataTestId}
    />
  );
};
