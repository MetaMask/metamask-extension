import React from 'react';

import { Box } from '../../../../../../components/component-library';
import { BlockSize } from '../../../../../../helpers/constants/design-system';
import { TypedSignDataV1Type } from '../../../../types/confirm';
import { DataTree } from '../dataTree';

export const ConfirmInfoRowTypedSignDataV1 = ({
  data,
}: {
  data?: TypedSignDataV1Type;
}) => {
  if (!data) {
    return null;
  }

  const parsedData = data.reduce(
    (val, { name, value, type }) => ({ ...val, [name]: { type, value } }),
    {},
  );

  return (
    <Box width={BlockSize.Full}>
      <Box style={{ marginLeft: -8 }}>
        <DataTree data={parsedData} />
      </Box>
    </Box>
  );
};
