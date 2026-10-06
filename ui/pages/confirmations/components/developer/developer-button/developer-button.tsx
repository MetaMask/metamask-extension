import React from 'react';

import { Button } from '../../../../../components/component-library/button/button';
import {
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library/button/button.types';

export type DeveloperButtonProps = {
  disabled?: boolean;
  onPress: () => void;
  title: string;
};

export const DeveloperButton = ({
  disabled,
  onPress,
  title,
}: DeveloperButtonProps) => {
  return (
    <Button
      variant={ButtonVariant.Primary}
      size={ButtonSize.Sm}
      onClick={onPress}
      disabled={disabled}
    >
      {title}
    </Button>
  );
};
