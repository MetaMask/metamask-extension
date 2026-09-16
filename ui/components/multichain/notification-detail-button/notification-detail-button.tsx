import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '@metamask/design-system-react';

export type NotificationDetailButtonProps = {
  /**
   * Button Variant (defaults to secondary)
   */
  variant: ButtonVariant;
  /**
   * Button Text
   */
  text: string;
  /**
   * Optional href if this navigates to a page
   */
  href?: string;
  /**
   * Opens Href in a seperate window
   */
  isExternal?: boolean;
  /**
   * Additional click functionality when button is pressed
   * Can be used to call analytic events
   */
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
};

export const NotificationDetailButton = ({
  variant = ButtonVariant.Secondary,
  text,
  href,
  isExternal = false,
  onClick,
}: NotificationDetailButtonProps) => {
  return (
    <Button
      asChild={Boolean(href)}
      variant={variant}
      size={ButtonSize.Lg}
      isFullWidth
      endIconName={isExternal ? IconName.Arrow2UpRight : undefined}
      onClick={onClick}
    >
      {href ? (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {text}
        </a>
      ) : (
        text
      )}
    </Button>
  );
};
