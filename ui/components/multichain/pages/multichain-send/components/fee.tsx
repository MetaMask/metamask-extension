import React from 'react';

import { Box, Text } from '../../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { MulitichainFeeEstimate } from '../../../../../ducks/multichain-send/multichain-send';
import { FeeRow } from './fee-row';

export type MultichainFeeProps = {
  estimatedFee: MulitichainFeeEstimate;
  backgroundColor: BackgroundColor;
};

export const MultichainFee = ({
  estimatedFee,
  backgroundColor,
}: MultichainFeeProps) => {
  console.log('estimated fee', estimatedFee);

  return (
    <Box
      borderRadius={BorderRadius.SM}
      backgroundColor={backgroundColor}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={4}
      gap={4}
      marginBottom={2}
    >
      <FeeRow
        isLoading={!estimatedFee}
        title="Estimated Fee"
        value={
          <>
            <Text color={TextColor.textAlternative} marginRight={2}>
              {estimatedFee?.feeInFiat}
            </Text>
            <Text>{`${estimatedFee?.fee} ${estimatedFee?.unit}`}</Text>
          </>
        }
        tooltipText="The fee is an estimate and may vary based on network conditions."
      />
      <FeeRow
        isLoading={!estimatedFee}
        title="Speed"
        value={
          <Text color={TextColor.textDefault}>
            {estimatedFee?.confirmationTime}
          </Text>
        }
      />
    </Box>
  );
};
