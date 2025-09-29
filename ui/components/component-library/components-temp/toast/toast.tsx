import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { Box } from '../../box';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { BannerBase, BannerBaseProps } from '../../banner-base';

export type ToastProps = BannerBaseProps<'div'> & {
  autoHideTime?: number;
  onAutoHideToast?: () => void;
};

export const ToastContainer = ({
  children,
}: {
  children: React.ReactNode | string;
}) => <Box className="toasts-container">{children}</Box>;

export const Toast = (props: ToastProps) => {
  const { theme } = document.documentElement.dataset;
  const [shouldDisplay, setShouldDisplay] = useState(true);
  const {
    autoHideTime,
    onAutoHideToast,
    description,
    descriptionProps,
    titleProps,
    className = '',
  } = props;
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
    [autoHideTime, onAutoHideToast],
  );

  if (!shouldDisplay) {
    return null;
  }

  return (
    <BannerBase
      data-theme={theme === ThemeType.light ? ThemeType.dark : ThemeType.light}
      backgroundColor={BackgroundColor.backgroundSection}
      borderRadius={BorderRadius.XL}
      borderWidth={1}
      borderColor={BorderColor.borderMuted}
      description={description}
      {...props}
      descriptionProps={{
        variant: TextVariant.bodySm,
        color: TextColor.textAlternativeSoft,
        ...descriptionProps,
      }}
      titleProps={{
        variant: TextVariant.bodyMdMedium,
        ...titleProps,
      }}
      className={classnames('toast-banner', className)}
    />
  );
};
