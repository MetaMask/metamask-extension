import React, { useEffect, useState } from 'react';
import { ThemeType } from '../../../../shared/constants/preferences';
import { BannerBase, Box, ButtonLink, Text } from '../../component-library';
import {
  BorderRadius,
  Display,
  TextVariant,
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
  onActionClick,
  onClose,
  borderRadius,
  textVariant,
  autoHideTime,
  onAutoHideToast,
  dataTestId,
}: {
  startAdornment: React.ReactNode | React.ReactNode[];
  text: string;
  actionText?: string;
  onActionClick?: () => void;
  onClose: () => void;
  borderRadius?: BorderRadius;
  textVariant?: TextVariant;
  autoHideTime?: number;
  onAutoHideToast?: () => void;
  dataTestId?: string;
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
    >
      <Box display={Display.Flex} gap={4} data-testid={dataTestId}>
        {startAdornment}
        <Box>
          <Text className="toast-text" variant={textVariant}>
            {text}
          </Text>
          {actionText && onActionClick ? (
            <ButtonLink onClick={onActionClick}>{actionText}</ButtonLink>
          ) : null}
        </Box>
      </Box>
    </BannerBase>
  );
};
