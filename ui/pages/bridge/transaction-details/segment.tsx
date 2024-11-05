import React from 'react';
import { Box } from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
} from '../../../helpers/constants/design-system';
import { StatusTypes } from '../../../../app/scripts/controllers/bridge-status/types';

const height = '4px';

export default function Segment({
  type,
  width,
}: {
  type: StatusTypes | null;
  width: BlockSize;
}) {
  return (
    <Box display={Display.Flex} width={width} style={{ height }}>
      {/* Not started segment */}
      {type === null && (
        <Box
          width={BlockSize.Full}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.pill}
        />
      )}
      {/* Pending segment */}
      {type === StatusTypes.PENDING && (
        <Box display={Display.Flex} width={BlockSize.Full}>
          <Box
            width={BlockSize.Half}
            backgroundColor={BackgroundColor.primaryDefault}
            borderRadius={BorderRadius.pill}
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />
          <Box
            width={BlockSize.Half}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.pill}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          />
        </Box>
      )}

      {/* Complete segment */}
      {type === StatusTypes.COMPLETE && (
        <Box
          width={BlockSize.Full}
          backgroundColor={BackgroundColor.primaryDefault}
          borderRadius={BorderRadius.pill}
        />
      )}
    </Box>
  );
}
