import React from 'react';
import {
  Button,
  ButtonVariant,
  ButtonSize,
  IconName,
} from '../../component-library';
import { BlockSize } from '../../../helpers/constants/design-system';

type NotificationDetailButtonProps = {
  variant: ButtonVariant;
  text: string;
  href: string;
  id: string;
  isExternal?: boolean;
  endIconName?: boolean;
};

export const NotificationDetailButton = ({
  variant = ButtonVariant.Secondary,
  text,
  href,
  id,
  isExternal = false,
  endIconName = true,
}: NotificationDetailButtonProps) => {
  return (
    <Button
      key={id}
      href={href}
      variant={variant}
      externalLink={isExternal || true}
      size={ButtonSize.Lg}
      width={BlockSize.Full}
      endIconName={endIconName ? IconName.Arrow2UpRight : undefined}
    >
      {text}
    </Button>
  );
};
