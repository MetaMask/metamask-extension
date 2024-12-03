import React, { useEffect, useState } from 'react';
import { ThemeType } from '../../../../shared/constants/preferences';
import {
  BannerBase,
  Box,
  ButtonBase,
  ButtonLink,
  Text,
} from '../../component-library';
import {
  BorderRadius,
  Display,
  TextVariant,
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';

export const ToastContainer = ({
  children,
}: {
  children: React.ReactNode | string;
}) => <Box className="toasts-container">{children}</Box>;

export const Toast = ({
  startAdornment,
  text,
  actionText,
  hasLink = true,
  onActionClick,
  onClose,
  borderRadius,
  textVariant,
  autoHideTime,
  onAutoHideToast,
  dataTestId,
  className,
}: {
  startAdornment: React.ReactNode | React.ReactNode[];
  text: string;
  actionText?: string;
  hasLink?: boolean;
  onActionClick?: () => void;
  onClose: () => void;
  borderRadius?: BorderRadius;
  textVariant?: TextVariant;
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
      borderRadius={borderRadius}
      data-testid={dataTestId ? `${dataTestId}-banner-base` : undefined}
      className={`toasts-container__banner-base ${className}`}
    >
      <Box display={Display.Flex} gap={4} data-testid={dataTestId}>
        {startAdornment}
        <Box>
          <Text className="toast-text" variant={textVariant}>
            {text}
          </Text>
          {actionText && onActionClick && (
            <>
              {hasLink ? (
                <ButtonLink onClick={onActionClick}>{actionText}</ButtonLink>
              ) : (
                <Box paddingTop={2}>
                  <ButtonBase
                    backgroundColor={BackgroundColor.transparent}
                    borderColor={BorderColor.borderDefault}
                    onClick={onActionClick}
                  >
                    {actionText}
                  </ButtonBase>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </BannerBase>
  );
};
