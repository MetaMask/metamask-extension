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
  type TextProps,
  type ButtonProps,
  type BoxProps,
} from '@metamask/design-system-react';

export type TabEmptyStateProps = Omit<BoxProps, 'ref'> & {
  /**
   * The icon to display in the empty state if this is an png/jpg image you will need to account for light and dark theme with useTheme
   */
  icon?: React.ReactNode;
  /**
   * The description to display in the empty state
   */
  description?: string;
  /**
   * The props to pass to the description Text component
   */
  descriptionProps?: Partial<TextProps>;
  /**
   * The text to display in the action button
   */
  actionButtonText?: string;
  /**
   * The props to pass to the action button
   */
  actionButtonProps?: Partial<ButtonProps>;
  /**
   * The function to call when the action button is clicked
   */
  onAction?: () => void;
  /**
   * Additional classNames to apply to the TabEmptyState
   */
  className?: string;
  /**
   * Any additional children to display in the TabEmptyState
   */
  children?: React.ReactNode;
};

export const TabEmptyState: React.FC<TabEmptyStateProps> = ({
  icon,
  description,
  descriptionProps,
  actionButtonText,
  actionButtonProps,
  onAction,
  className,
  children,
  ...props
}) => {
  return (
    <Box
      className={twMerge(className, 'max-w-56')}
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      gap={3}
      {...props}
    >
      {icon}
      {description && (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
          {...descriptionProps}
        >
          {description}
        </Text>
      )}
      {actionButtonText && (
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onAction}
          {...actionButtonProps}
        >
          {actionButtonText}
        </Button>
      )}
      {children}
    </Box>
  );
};
