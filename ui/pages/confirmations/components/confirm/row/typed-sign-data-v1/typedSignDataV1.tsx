import React from 'react';

import { Box } from '../../../../../../components/component-library';
import { BlockSize } from '../../../../../../helpers/constants/design-system';

import { DataTree } from '../dataTree';

export const ConfirmInfoRowTypedSignDataV1 = ({ data }: any) => {
  if (!data) {
    return null;
  }

  return (
    <Box width={BlockSize.Full} style={{ margin: '0 -8px' }}>
      <Box style={{ margin: '0 -8px' }}>
        <DataTree data={data} />
      </Box>
    </Box>
  );
};
