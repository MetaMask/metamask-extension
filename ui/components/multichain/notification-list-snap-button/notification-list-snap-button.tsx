import React, { FC } from 'react';

import { Button, ButtonVariant, IconName } from '../../component-library';
import { BlockSize } from '../../../helpers/constants/design-system';

export type NotificationListSnapButtonProps = {
  onClick: () => void;
  text: string;
};

export const NotificationListSnapButton: FC<
  NotificationListSnapButtonProps
> = ({ onClick, text }) => {
  const handleNameClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <Button
      width={BlockSize.Full}
      onClick={handleNameClick}
      variant={ButtonVariant.Secondary}
      endIconName={IconName.Arrow2UpRight}
    >
      {text}
    </Button>
  );
};
