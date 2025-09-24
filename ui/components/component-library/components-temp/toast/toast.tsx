import React, { useEffect, useState } from 'react';
import { Box } from '../../box';
import {
  BorderColor,
  BorderRadius,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { BannerBase } from '../../banner-base';
import { TextProps } from '../../text';

export const ToastContainer = ({
  children,
}: {
  children: React.ReactNode | string;
}) => <Box className="toasts-container">{children}</Box>;

export const Toast = ({
  startAdornment,
  title,
  titleProps,
  description,
  descriptionProps,
  actionText,
  onActionClick,
  onClose,
  borderRadius,
  autoHideTime,
  onAutoHideToast,
  dataTestId,
  className,
}: {
  startAdornment: React.ReactNode | React.ReactNode[];
  title: string;
  titleProps?: TextProps<'p'>;
  description?: string;
  descriptionProps?: TextProps<'p'>;
  actionText?: string;
  onActionClick?: () => void;
  onClose: () => void;
  borderRadius?: BorderRadius;
  autoHideTime?: number;
  onAutoHideToast?: () => void;
  dataTestId?: string;
  className?: string;
}) => {
  const { theme } = document.documentElement.dataset;
  const [shouldDisplay, setShouldDisplay] = useState(true);
  useEffect(
    function () {
      if (!autoHideTime || autoHideTime === 0) {
        return undefined;
      }

      const timeout = setTimeout(() => {
        setShouldDisplay(false);
        onAutoHideToast?.();
      }, autoHideTime);

      return function () {
        clearTimeout(timeout);
      };
    },
    [autoHideTime],
  );

  if (!shouldDisplay) {
    return null;
  }

  return (
    <BannerBase
      data-theme={theme === ThemeType.light ? ThemeType.dark : ThemeType.light}
      onClose={onClose}
      borderRadius={borderRadius || BorderRadius.XL}
      borderWidth={1}
      borderColor={BorderColor.borderMuted}
      data-testid={dataTestId ? `${dataTestId}-banner-base` : undefined}
      className={className}
      startAccessory={startAdornment}
      title={title}
      titleProps={{
        variant: TextVariant.bodyMdMedium,
        ...titleProps,
      }}
      description={description}
      descriptionProps={{
        variant: TextVariant.bodySm,
        color: TextColor.textAlternativeSoft,
        ...descriptionProps,
      }}
      actionButtonLabel={actionText}
      actionButtonOnClick={onActionClick}
    />
  );
};
