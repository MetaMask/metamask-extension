import React from 'react';

import { Box } from '@metamask/design-system-react';
import { TypedSignDataV1Type } from '../../../../types/confirm';
import { DataTree } from '../dataTree';

export const ConfirmInfoRowTypedSignDataV1 = ({
  data,
  chainId,
}: {
  data?: TypedSignDataV1Type;
  chainId: string;
}) => {
  if (!data) {
    return null;
  }

  const parsedData = data.reduce(
    (val, { name, value, type }) => ({ ...val, [name]: { type, value } }),
    {},
  );

  return (
    <Box className="w-full">
      <Box style={{ marginLeft: -8 }}>
        <DataTree data={parsedData} chainId={chainId} />
      </Box>
    </Box>
  );
};
