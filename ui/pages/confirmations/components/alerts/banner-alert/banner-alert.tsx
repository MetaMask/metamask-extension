import React from 'react';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

export function BannerAlert({
  message,
  onClick,
}: {
  message: string;
  onClick?: () => void;
}) {
  return (
    <Text
      variant={TextVariant.bodySm}
      color={TextColor.errorDefault}
      onClick={onClick}
    >
      {message}
    </Text>
  );
}
