import React from 'react';
import classnames from 'classnames';
import { Box } from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { StatusTypes } from '../../../../shared/types/bridge-status';

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
