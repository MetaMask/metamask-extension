import React, { memo } from 'react';
import { toChecksumAddress } from 'ethereumjs-util';
import { NameType } from '@metamask/name-controller';
import { Text } from '../../../component-library';
import { shortenAddress } from '../../../../helpers/utils/util';
import { TextVariant } from '../../../../helpers/constants/design-system';

function formatValue(
  value: string,
  type: NameType,
  addressSideLength?: number,
): string {
  if (!value.length) {
    return value;
  }

  switch (type) {
    case NameType.ETHEREUM_ADDRESS: {
      const checksumAddress = toChecksumAddress(value);
      if (!addressSideLength) {
        return shortenAddress(checksumAddress);
      }
      if (checksumAddress.length <= addressSideLength * 2) {
        return checksumAddress;
      }

      return `${checksumAddress.slice(0, addressSideLength)}...${checksumAddress.slice(-addressSideLength)}`;
    }

    default:
      return value;
  }
}

export type FormattedValueProps = {
  value: string;
  type: NameType;
  addressSideLength?: number;
};

const FormattedValue = memo(
  ({ value, type, addressSideLength, ...props }: FormattedValueProps) => {
    const formattedValue = formatValue(value, type, addressSideLength);
    return (
      <Text className="name__value" variant={TextVariant.bodyMd} {...props}>
        {formattedValue}
      </Text>
    );
  },
);

export default FormattedValue;
