import React from 'react';
import { ThemeType } from '../../../../shared/constants/preferences';
import { BannerBase, Box, ButtonLink, Text } from '../../component-library';
import { Display } from '../../../helpers/constants/design-system';

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
}: {
  startAdornment: React.ReactNode | React.ReactNode[];
  text: string;
  actionText: string;
  onActionClick: () => void;
  onClose: () => void;
}) => {
  const { theme } = document.documentElement.dataset;

  return (
    <BannerBase
      data-theme={theme === ThemeType.light ? ThemeType.dark : ThemeType.light}
      onClose={onClose}
    >
      <Box display={Display.Flex} gap={4}>
        {startAdornment}
        <Box>
          <Text>{text}</Text>
          {actionText && onActionClick ? (
            <ButtonLink onClick={onActionClick}>{actionText}</ButtonLink>
          ) : null}
        </Box>
      </Box>
    </BannerBase>
  );
};
