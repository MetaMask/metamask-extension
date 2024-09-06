import React from 'react';

import BigNumber from 'bignumber.js';
import { Box, Text } from '../../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import {
  DraftTransaction,
  MulitichainFeeEstimate,
} from '../../../../../ducks/multichain-send/multichain-send';
import { FeeRow } from './fee-row';

export type MultichainFeeProps = {
  asset: DraftTransaction['transactionParams']['sendAsset'];
  estimatedFee: MulitichainFeeEstimate;
  backgroundColor: BackgroundColor;
};

export const MultichainFee = ({
  asset,
  estimatedFee,
  backgroundColor,
}: MultichainFeeProps) => {
  // TODO: fee to fiat conversion
  // fee is always in the smallest unit of the asset
  const fee = new BigNumber(estimatedFee?.fee || 0)
    .div(new BigNumber(10).pow(asset.assetDetails.details.decimals))
    .toString();

  return (
    <Box
      borderRadius={BorderRadius.LG}
      backgroundColor={backgroundColor}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={4}
      gap={4}
      marginBottom={2}
    >
      <FeeRow
        isLoading={estimatedFee.isLoading}
        title="Estimated Fee"
        value={
          <>
            <Text color={TextColor.textAlternative} marginRight={2}>
              {estimatedFee?.feeInFiat}
            </Text>
            <Text>{`${fee} ${estimatedFee?.unit}`}</Text>
          </>
        }
        tooltipText="The fee is an estimate and may vary based on network conditions."
      />
      <FeeRow
        isLoading={estimatedFee.isLoading}
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
