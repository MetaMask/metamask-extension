import React from 'react';
import { Box } from '../../../../../components/component-library/box/box';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { CustomAmountSkeleton } from '../../transactions/custom-amount/custom-amount';
import { PayTokenAmountSkeleton } from '../../pay-token-amount/pay-token-amount';
import { PercentageButtonsSkeleton } from '../../percentage-buttons/percentage-buttons';

const CenterContainerSkeleton = ({
  displayPercentageButtons,
}: {
  displayPercentageButtons?: boolean;
}) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={4}
      style={{ flex: 1 }}
    >
      <CustomAmountSkeleton />
      <PayTokenAmountSkeleton />
      {displayPercentageButtons && <PercentageButtonsSkeleton />}
    </Box>
  );
};

export function CustomAmountInfoSkeleton({
  displayPercentageButtons,
}: {
  displayPercentageButtons?: boolean;
} = {}) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ flex: 1 }}
      data-testid="custom-amount-info-skeleton"
    >
      <CenterContainerSkeleton
        displayPercentageButtons={displayPercentageButtons}
      />
    </Box>
  );
}
