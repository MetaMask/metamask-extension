import React from 'react';
import { Button } from '../../component-library/button/button';
import {
  ButtonVariant,
  ButtonSize,
} from '../../component-library/button/button.types';
import { IconName } from '../../component-library/icon/icon.types';
import { BlockSize } from '../../../helpers/constants/design-system';

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
    <>
      <Button
        href={href}
        externalLink={Boolean(href) && isExternal}
        variant={variant}
        size={ButtonSize.Lg}
        width={BlockSize.Full}
        endIconName={isExternal ? IconName.Arrow2UpRight : undefined}
        onClick={onClick}
      >
        {text}
      </Button>
    </>
  );
};
