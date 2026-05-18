import React from 'react';
import classnames from 'clsx';
import { StatusTypes } from '@metamask/bridge-controller';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function Segment({ type }: { type: StatusTypes | null }) {
  return (
    <Box
      className="w-full rounded-full"
      backgroundColor={BoxBackgroundColor.BackgroundAlternative}
    >
      <Box
        backgroundColor={BoxBackgroundColor.PrimaryDefault}
        className={classnames({
          'w-full rounded-full': true,
          'bridge-transaction-details__segment': true,
          'bridge-transaction-details__segment--pending':
            type === StatusTypes.PENDING,
          'bridge-transaction-details__segment--complete':
            type === StatusTypes.COMPLETE,
        })}
      />
    </Box>
  );
}
