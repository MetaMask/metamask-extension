import React from 'react';
import {
  Box,
  BoxBorderColor,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { DeFiPositionDetailsSection } from '@metamask/assets-controllers';
import DefiDetailsPositionCellV2 from './defi-details-position-cell-v2';

type DefiDetailsListV2Props = {
  sections: DeFiPositionDetailsSection[];
};

export default function DefiDetailsListV2({
  sections,
}: Readonly<DefiDetailsListV2Props>) {
  return (
    <>
      {sections.map((section, sectionIndex) => (
        <Box key={section.productName}>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="pl-4 pb-2"
            color={TextColor.TextAlternative}
            data-testid={`defi-details-list-v2-${section.productName}-section`}
          >
            {section.productName}
          </Text>
          {section.positions.map((position) => (
            // Isolate each cell so sibling `h-full` rows don't stretch under
            // the flex `.main-container`. Include groupId and poolAddress so
            // same-asset/type rows in different pools stay unique.
            <Box
              key={`${position.groupId}-${position.poolAddress}-${position.assetId}-${position.positionType}`}
            >
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
              <Box
                borderColor={BoxBorderColor.BorderMuted}
                className="w-full h-px border border-b-0"
                data-testid="defi-details-list-v2-section-separator"
              />
            </Box>
          )}
        </Box>
      ))}
    </>
  );
}
