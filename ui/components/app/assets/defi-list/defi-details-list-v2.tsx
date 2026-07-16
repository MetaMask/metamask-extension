import React from 'react';
import { Box } from '@metamask/design-system-react';
import type { DeFiPositionDetailsSection } from '@metamask/assets-controllers';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';
import DefiDetailsPositionCellV2 from './cells/defi-details-position-cell-v2';

type DefiDetailsListV2Props = {
  sections: DeFiPositionDetailsSection[];
};

const separatorStyle = {
  border: '1px solid var(--border-muted, #858B9A33)',
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DefiDetailsListV2({ sections }: DefiDetailsListV2Props) {
  return (
    <>
      {sections.map((section, sectionIndex) => (
        <Box key={section.protocolName}>
          <Text
            variant={TextVariant.bodyMdMedium}
            paddingLeft={4}
            paddingBottom={2}
            color={TextColor.textAlternative}
            data-testid={`defi-details-list-v2-${section.protocolName}-section`}
          >
            {section.protocolName}
          </Text>
          {section.positions.map((position) => (
            // Isolate each cell so sibling `h-full` rows don't stretch under
            // the flex `.main-container`.
            <Box key={`${position.assetId}-${position.positionType}`}>
              <DefiDetailsPositionCellV2 position={position} />
            </Box>
          ))}
          {sectionIndex !== sections.length - 1 && (
            <Box
              paddingLeft={4}
              paddingTop={4}
              paddingBottom={4}
              paddingRight={4}
            >
              <hr style={separatorStyle} />
            </Box>
          )}
        </Box>
      ))}
    </>
  );
}
