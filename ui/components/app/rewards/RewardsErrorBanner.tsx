import React from 'react';
import {
  Box,
  Text,
  Button,
  Icon,
  TextVariant,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonVariant,
  ButtonSize,
  IconName,
  IconSize,
  FontWeight,
} from '@metamask/design-system-react';

export type RewardsErrorBannerProps = {
  title: string;
  description: string;
  onDismiss?: () => void;
  onConfirm?: () => void;
  confirmButtonLabel?: string;
  onConfirmLoading?: boolean;
};

const RewardsErrorBanner: React.FC<RewardsErrorBannerProps> = ({
  title,
  description,
  onDismiss,
  onConfirm,
  confirmButtonLabel,
  onConfirmLoading,
}) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Start}
    className="bg-error-muted rounded-2xl p-4 gap-4 w-full"
    data-testid="rewards-error-banner"
  >
    {/* Column 1: Error Icon */}
    <Box className="w-8 h-8">
      <Icon
        name={IconName.Error}
        size={IconSize.Xl}
        className="text-error-default"
      />
    </Box>

    {/* Column 2: Content */}
    <Box className="flex flex-col gap-2">
      <Box className="flex flex-col gap-2">
        {/* Title */}
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold}>
          {title}
        </Text>

        {/* Description */}
        <Text variant={TextVariant.BodyMd}>{description}</Text>
      </Box>

      {/* Button Section */}
      {(onDismiss || onConfirm) && (
        <Box flexDirection={BoxFlexDirection.Row} className="gap-2">
          {onDismiss && (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Md}
              onClick={onDismiss}
              className="flex-1"
            >
              Dismiss
            </Button>
          )}
          {onConfirm && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Md}
              onClick={onConfirm}
              isLoading={onConfirmLoading}
              className="flex-1"
            >
              {confirmButtonLabel || 'Confirm'}
            </Button>
          )}
        </Box>
      )}
    </Box>
  </Box>
);

export default RewardsErrorBanner;
