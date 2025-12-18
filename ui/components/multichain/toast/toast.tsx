import React, { useEffect, useState } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import {
  BannerBase,
  Box,
  BoxProps,
  IconSize,
  Text,
} from '../../component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  TextColor,
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
  description,
  descriptionVariant,
  actionText,
  onActionClick,
  onClose,
  borderRadius,
  textVariant,
  autoHideTime,
  onAutoHideToast,
  dataTestId,
  className,
  contentProps,
}: {
  startAdornment: React.ReactNode | React.ReactNode[];
  text: string;
  description?: string;
  descriptionVariant?: TextVariant;
  actionText?: string;
  onActionClick?: () => void;
  onClose: () => void;
  borderRadius?: BorderRadius;
  textVariant?: TextVariant;
  autoHideTime?: number;
  onAutoHideToast?: () => void;
  dataTestId?: string;
  className?: string;
  contentProps?: BoxProps<'div'>;
}) => {
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
      onClose={onClose}
      backgroundColor={BackgroundColor.backgroundSection}
      borderWidth={1}
      borderColor={BorderColor.borderMuted}
      borderRadius={borderRadius || BorderRadius.XL}
      data-testid={dataTestId ? `${dataTestId}-banner-base` : undefined}
      closeButtonProps={{
        iconProps: {
          size: IconSize.Md,
        },
      }}
      className={`toasts-container__banner-base ${className}`}
    >
      <Box
        display={Display.Flex}
        gap={3}
        data-testid={dataTestId}
        {...contentProps}
      >
        {startAdornment && (
          <Box className="flex-shrink-0">{startAdornment}</Box>
        )}
        <Box>
          <Text
            className="toast-text"
            variant={textVariant || TextVariant.bodyMdMedium}
          >
            {text}
          </Text>
          {description && (
            <Text
              className="toast-text"
              variant={descriptionVariant || TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {description}
            </Text>
          )}
          {actionText && onActionClick ? (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              textProps={{
                variant: DsTextVariant.BodySm,
              }}
              onClick={onActionClick}
              className="mt-2 rounded-lg"
            >
              {actionText}
            </Button>
          ) : null}
        </Box>
      </Box>
    </BannerBase>
  );
};
