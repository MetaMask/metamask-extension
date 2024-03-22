import React from 'react';

import { isValidHexAddress } from '../../../../../../../shared/modules/hexstring-utils';
import { sanitizeString } from '../../../../../../helpers/utils/util';

import { Box } from '../../../../../../components/component-library';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';

type TreeData = {
  value: string | Record<string, TreeData>;
  type: string;
};

export const DataTree = ({ data }: { data: Record<string, TreeData> }) => (
  <Box marginLeft={2}>
    {Object.entries(data).map(([label, { value, type }], i) => {
      if (typeof value === 'object' && value !== null) {
        return <DataTree data={value} key={`tree-data-${label}-index-${i}`} />;
      }
      return (
        <ConfirmInfoRow
          label={`${sanitizeString(
            label.charAt(0).toUpperCase() + label.slice(1),
          )}:`}
          key={`tree-data-${label}-index-${i}`}
        >
          {type === 'address' &&
          isValidHexAddress(value, {
            mixedCaseUseChecksum: true,
          }) ? (
            <ConfirmInfoRowAddress address={value} />
          ) : (
            <ConfirmInfoRowText text={value} />
          )}
        </ConfirmInfoRow>
      );
    })}
  </Box>
);
