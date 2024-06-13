import React from 'react';

import { isValidHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { sanitizeString } from '../../../../../helpers/utils/util';

import { Box } from '../../../../../components/component-library';
import { BlockSize } from '../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDate,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';

type ValueType = string | Record<string, TreeData> | TreeData[];

export type TreeData = {
  value: ValueType;
  type: string;
};

export const DataTree = ({
  data,
  isPermit = false,
}: {
  data: Record<string, TreeData> | TreeData[];
  isPermit?: boolean;
}) => (
  <Box width={BlockSize.Full}>
    {Object.entries(data).map(([label, { value, type }], i) => (
      <ConfirmInfoRow
        label={`${sanitizeString(
          label.charAt(0).toUpperCase() + label.slice(1),
        )}:`}
        style={{ paddingRight: 0 }}
        key={`tree-data-${label}-index-${i}`}
      >
        {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          <DataField
            label={label}
            isPermit={isPermit}
            value={value}
            type={type}
          />
        }
      </ConfirmInfoRow>
    ))}
  </Box>
);

const DataField = ({
  label,
  isPermit,
  type,
  value,
}: {
  label: string;
  isPermit: boolean;
  type: string;
  value: ValueType;
}) => {
  if (typeof value === 'object' && value !== null) {
    return <DataTree data={value} isPermit={isPermit} />;
  }
  if (isPermit && label === 'deadline') {
    return <ConfirmInfoRowDate date={parseInt(value)} />;
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
