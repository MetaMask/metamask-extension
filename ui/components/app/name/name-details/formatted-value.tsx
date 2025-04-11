import { NameType } from '@metamask/name-controller';
import { toChecksumAddress } from 'ethereumjs-util';
import React, { memo } from 'react';

import { TextVariant } from '../../../../helpers/constants/design-system';
import { shortenAddress } from '../../../../helpers/utils/util';
import { Text } from '../../../component-library';

function formatValue(value: string, type: NameType): string {
  if (!value.length) {
    return value;
  }

  switch (type) {
    case NameType.ETHEREUM_ADDRESS:
      return shortenAddress(toChecksumAddress(value));

    default:
      return value;
  }
}

export type FormattedValueProps = {
  value: string;
  type: NameType;
};

const FormattedValue = memo(({ value, type }: FormattedValueProps) => {
  const formattedValue = formatValue(value, type);
  return (
    <Text className="name__value" variant={TextVariant.bodyMd}>
      {formattedValue}
    </Text>
  );
});

export default FormattedValue;
