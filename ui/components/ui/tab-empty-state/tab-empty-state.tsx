import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBackgroundColor,
  Button,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  twMerge,
} from '@metamask/design-system-react';

export type TabEmptyStateProps = {
  icon: React.ReactNode;
  description?: string;
  descriptionProps?: React.ComponentProps<typeof Text>;
  actionButtonText?: string;
  actionButtonProps?: React.ComponentProps<typeof Button>;
  onAction?: () => void;
  className?: string;
};

export const TabEmptyState: React.FC<TabEmptyStateProps> = ({
  icon,
  description,
  descriptionProps,
  actionButtonText,
  actionButtonProps,
  onAction,
  className,
  ...props
}) => {
  return (
    <Box
      className={twMerge(className, 'max-w-56')}
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      {...props}
    >
      <Box marginBottom={4}>{icon}</Box>
      {description && (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
          className="mb-4"
          {...descriptionProps}
        >
          {description}
        </Text>
      )}
      {actionButtonText && (
        <Button
          variant={ButtonVariant.Tertiary}
          onClick={onAction}
          {...actionButtonProps}
        >
          {actionButtonText}
        </Button>
      )}
    </Box>
  );
};
