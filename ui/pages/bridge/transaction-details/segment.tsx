import React from 'react';
import classnames from 'classnames';
import { StatusTypes } from '@metamask/bridge-controller';
import { Box } from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
} from '../../../helpers/constants/design-system';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function Segment({ type }: { type: StatusTypes | null }) {
  return (
    <Box
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.pill}
    >
      <Box
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.primaryDefault}
        borderRadius={BorderRadius.pill}
        className={classnames({
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
