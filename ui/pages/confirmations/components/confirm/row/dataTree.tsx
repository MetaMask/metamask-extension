import React from 'react';

import { isValidHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { sanitizeString } from '../../../../../helpers/utils/util';

import { Box } from '../../../../../components/component-library';
import { BlockSize } from '../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';

type ValueType = string | Record<string, TreeData> | TreeData[];

type TreeData = {
  value: ValueType;
  type: string;
};

const DataField = ({ value, type }: { value: ValueType; type: string }) => {
  if (typeof value === 'object' && value !== null) {
    return <DataTree data={value} />;
  }
  if (
    type === 'address' &&
    isValidHexAddress(value, {
      mixedCaseUseChecksum: true,
    })
  ) {
    return <ConfirmInfoRowAddress address={value} />;
  }
  return <ConfirmInfoRowText text={sanitizeString(value)} />;
};

export const DataTree = ({
  data,
}: {
  data: Record<string, TreeData> | TreeData[];
}) => (
  <Box width={BlockSize.Full}>
    {Object.entries(data).map(([label, { value, type }], i) => {
      return (
        <ConfirmInfoRow
          label={`${sanitizeString(
            label.charAt(0).toUpperCase() + label.slice(1),
          )}:`}
          style={{ paddingRight: 0 }}
          key={`tree-data-${label}-index-${i}`}
        >
          <DataField value={value} type={type} />
        </ConfirmInfoRow>
      );
    })}
  </Box>
);
