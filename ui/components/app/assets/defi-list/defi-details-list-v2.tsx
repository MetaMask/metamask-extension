import React from 'react';
import { Box } from '@metamask/design-system-react';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from "../../../component-library";
import type { DefiProtocolDetailsSection } from '../utils/group-defi-protocol-details';
import DefiDetailsPositionCellV2 from './cells/defi-details-position-cell-v2';

type DefiDetailsListV2Props = {
  sections: DefiProtocolDetailsSection[];
};

const separatorStyle = {
  border: '1px solid var(--border-muted, #858B9A33)',
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DefiDetailsListV2({ sections }: DefiDetailsListV2Props) {
  return (
    <>
      {sections.map((section) => (
        <Box key={section.protocolName}>
          <Text
            variant={TextVariant.bodyMdMedium}
            paddingLeft={4}
            color={TextColor.textAlternative}
            data-testid={`defi-details-list-v2-${section.protocolName}-section`}
          >
            {section.protocolName}
          </Text>
          {section.poolGroups.map((poolGroup, poolGroupIndex) => (
            <Box key={`${section.protocolName}-${poolGroup.poolAddress}`}>
              {poolGroup.positions.map((position) => (
                <DefiDetailsPositionCellV2
                  key={`${position.assetId}-${position.positionType}`}
                  position={position}
                />
              ))}
              {poolGroupIndex !== section.poolGroups.length - 1 && (
                <Box paddingLeft={4} paddingBottom={4} paddingRight={4}>
                  <hr style={separatorStyle} />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      ))}
    </>
  );
}
