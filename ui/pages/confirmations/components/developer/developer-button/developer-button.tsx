import React from 'react';

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';

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
