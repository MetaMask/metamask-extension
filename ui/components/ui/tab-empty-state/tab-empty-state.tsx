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
} from '@metamask/design-system-react';

export type TabEmptyStateProps = {
  icon: React.ReactNode;
  description: string;
  actionText: string;
  onAction: () => void;
  className?: string;
};

export const TabEmptyState: React.FC<TabEmptyStateProps> = ({
  icon,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <Box
      className={className}
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={6}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      <Box marginBottom={4}>{icon}</Box>
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextMuted}
        textAlign={TextAlign.Center}
        className="mb-4"
      >
        {description}
      </Text>

      <Button variant={ButtonVariant.Tertiary} onClick={onAction}>
        {actionText}
      </Button>
    </Box>
  );
};
