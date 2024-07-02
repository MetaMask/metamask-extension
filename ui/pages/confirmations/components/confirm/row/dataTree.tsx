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
import { formatNumber } from '../utils';

type ValueType = string | Record<string, TreeData> | TreeData[];

export type TreeData = {
  value: ValueType;
  type: string;
};

export const DataTree = ({
  data,
  isPermit = false,
  tokenDecimals = 0,
}: {
  data: Record<string, TreeData> | TreeData[];
  isPermit?: boolean;
  tokenDecimals?: number;
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
            tokenDecimals={tokenDecimals}
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
  tokenDecimals,
}: {
  label: string;
  isPermit: boolean;
  type: string;
  value: ValueType;
  tokenDecimals: number;
}) => {
  if (typeof value === 'object' && value !== null) {
    return (
      <DataTree
        data={value}
        isPermit={isPermit}
        tokenDecimals={tokenDecimals}
      />
    );
  }
  if (isPermit && label === 'value') {
    return (
      <ConfirmInfoRowText
        text={formatNumber(
          parseInt(value, 10) / Math.pow(10, tokenDecimals),
          tokenDecimals,
        )}
      />
    );
  }
  if (isPermit && label === 'deadline') {
    return <ConfirmInfoRowDate date={parseInt(value, 10)} />;
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
