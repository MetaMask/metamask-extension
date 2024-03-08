import React from 'react';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

export function InlineAlert({ onClick }: { onClick: () => void }) {
  return (
    <Text
      variant={TextVariant.bodySm}
      color={TextColor.errorDefault}
      onClick={onClick}
    >
      Alert
    </Text>
  );
}
