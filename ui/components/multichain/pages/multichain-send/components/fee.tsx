import React from 'react';

import { BigNumber } from 'bignumber.js';
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
  SendStage,
} from '../../../../../ducks/multichain-send/multichain-send';
import { convertUnitToHighestDenomination } from '../../../../../helpers/utils/multichain/convertUnitToHighestDenomination';
import { useMultichainCurrencyDisplayByAsset } from '../../../../../hooks/useMultichainCurrencyDisplayByAsset';
import { FeeRow } from './fee-row';

export type MultichainFeeProps = {
  asset: DraftTransaction['transactionParams']['sendAsset'];
  estimatedFee: MulitichainFeeEstimate;
  backgroundColor: BackgroundColor;
  sendStage: SendStage;
};

export const MultichainFee = ({
  asset,
  estimatedFee,
  backgroundColor,
  sendStage,
}: MultichainFeeProps) => {
  // fee is always in the smallest unit of the asset
  const fee = convertUnitToHighestDenomination({
    asset: asset.assetDetails,
    amount: estimatedFee.fee,
  });

  const { fiatValue: feeFiatValue, displayValue: feeDisplayValue } =
    useMultichainCurrencyDisplayByAsset({
      assetDetails: asset.assetDetails,
      amount: fee,
    });

  const { fiatValue: totalFiatValue, displayValue: totalDisplayValue } =
    useMultichainCurrencyDisplayByAsset({
      assetDetails: asset.assetDetails,
      amount: new BigNumber(asset.amount)
        .plus(new BigNumber(estimatedFee.fee))
        .toString(),
    });

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
              {feeFiatValue}
            </Text>
            <Text data-testid="multichain-confirmation-fee">
              {feeDisplayValue}
            </Text>
          </>
        }
        tooltipText="The fee is an estimate and may vary based on network conditions."
      />
      {estimatedFee?.confirmationTime && (
        <FeeRow
          isLoading={estimatedFee.isLoading}
          title="Speed"
          value={
            <Text color={TextColor.textDefault}>
              {estimatedFee.confirmationTime}
            </Text>
          }
        />
      )}
      {sendStage === SendStage.PUBLISHING && (
        <FeeRow
          isLoading={estimatedFee.isLoading}
          title="Total"
          value={
            <>
              <Text color={TextColor.textAlternative} marginRight={2}>
                {totalFiatValue}
              </Text>
              <Text data-testid="multichain-confirmation-total-fee">
                {totalDisplayValue}
              </Text>
            </>
          }
        />
      )}
    </Box>
  );
};
