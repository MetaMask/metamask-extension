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

interface RewardsErrorBannerProps {
  title: string;
  description: string;
  onDismiss?: () => void;
  onConfirm?: () => void;
  confirmButtonLabel?: string;
  onConfirmLoading?: boolean;
  testID?: string;
}

const RewardsErrorBanner: React.FC<RewardsErrorBannerProps> = ({
  title,
  description,
  onDismiss,
  onConfirm,
  confirmButtonLabel,
  onConfirmLoading,
  testID,
}) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Start}
    className="bg-error-muted rounded-2xl p-4 gap-4 w-full"
    data-testid={testID}
  >
    {/* Column 1: Error Icon */}
    <Icon
      name={IconName.Error}
      size={IconSize.Xl}
      className="text-error-default"
    />

    {/* Column 2: Content */}
    <Box className="flex-1 gap-4">
      <Box className="gap-1">
        {/* Title */}
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold}>
          {title}
        </Text>

        {/* Description */}
        <Text variant={TextVariant.BodyMd}>{description}</Text>
      </Box>

      {/* Button Section */}
      {(onDismiss || onConfirm) && (
        <Box flexDirection={BoxFlexDirection.Row} className="gap-3">
          {onDismiss && (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Md}
              onClick={onDismiss}
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
