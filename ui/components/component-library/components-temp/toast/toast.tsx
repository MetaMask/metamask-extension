import React, { useEffect, useState } from 'react';
import { Box } from '../../box';
import {
  BorderColor,
  BorderRadius,
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { BannerBase } from '../../banner-base';
import { ButtonLink } from '../../button-link';
import { Text } from '../../text';

export const ToastContainer = ({
  children,
}: {
  children: React.ReactNode | string;
}) => <Box className="toasts-container">{children}</Box>;

export const Toast = ({
  startAdornment,
  title,
  description,
  actionText,
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
  title: string;
  description?: string;
  actionText?: string;
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
      borderRadius={borderRadius || BorderRadius.XL}
      borderWidth={1}
      borderColor={BorderColor.borderMuted}
      data-testid={dataTestId ? `${dataTestId}-banner-base` : undefined}
      className={className}
      startAccessory={startAdornment}
      title={title}
      description={description}
      actionButtonLabel={actionText}
      actionButtonOnClick={onActionClick}
    />
  );
  /* <Box display={Display.Flex} gap={4} data-testid={dataTestId}>
        <Box>
          <Text className="break-normal" variant={textVariant}>
            {title}
          </Text>
          {description && (
            <Text className="break-normal" variant={TextVariant.bodySm}>
              {description}
            </Text>
          )}
          {actionText && onActionClick ? (
            <ButtonLink onClick={onActionClick}>{actionText}</ButtonLink>
          ) : null}
        </Box>
      </Box>
    </BannerBase> */
};
