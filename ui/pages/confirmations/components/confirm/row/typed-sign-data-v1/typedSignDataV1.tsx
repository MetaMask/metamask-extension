import React from 'react';

import { Box } from '../../../../../../components/component-library';
import { BlockSize } from '../../../../../../helpers/constants/design-system';

import { DataTree, TreeData } from '../dataTree';

export const ConfirmInfoRowTypedSignDataV1 = ({
  data,
}: {
  data?: Record<string, TreeData>;
}) => {
  if (!data) {
    return null;
  }

  return (
    <Box width={BlockSize.Full}>
      <Box style={{ marginLeft: -8 }}>
        <DataTree data={data} />
      </Box>
    </Box>
  );
};
