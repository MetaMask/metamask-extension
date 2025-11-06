import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import {
  Box,
  BoxFlexDirection,
  TextColor,
} from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
import { QuoteResponse } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';

import { TokenStandAndDetails } from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { SimulationDetailsLayout } from '../../simulation-details/simulation-details';
import { BalanceChangeRow } from '../../simulation-details/balance-change-row';

export const QuoteSwapSimulationDetails = ({
  quote,
  fiatRates,
  sourceTokenAmount,
  tokenDetails,
}: {
  quote?: QuoteResponse;
  fiatRates?: Record<Hex, number | undefined>;
  sourceTokenAmount?: string;
  tokenDetails?: Record<Hex, TokenStandAndDetails>;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { id: transactionId } = currentConfirmation;

  const { srcAssetBalanceChange, destAssetBalanceChange } = useMemo(() => {
    if (!quote || !tokenDetails || !fiatRates) {
      return {};
    }
    const { srcAsset, srcTokenAmount, destAsset, destTokenAmount } =
      quote.quote;
    return {
      srcAssetBalanceChange: {
        asset: {
          ...tokenDetails[srcAsset.address as Hex],
          chainId: toHex(srcAsset.chainId),
          address: srcAsset.address as Hex,
        } as any,
        amount: new BigNumber(sourceTokenAmount ?? '0x0', 16).dividedBy(
          new BigNumber(10).pow(srcAsset.decimals),
        ),
        fiatAmount: new BigNumber(srcTokenAmount)
          .dividedBy(new BigNumber(10).pow(srcAsset.decimals))
          .times(fiatRates[srcAsset.address as Hex] ?? 0)
          .toNumber(),
        usdAmount: 0,
        color: TextColor.ErrorAlternative,
      },
      destAssetBalanceChange: {
        asset: {
          ...tokenDetails[destAsset.address as Hex],
          chainId: toHex(destAsset.chainId),
          address: destAsset.address as Hex,
        } as any,
        amount: new BigNumber(destTokenAmount).dividedBy(
          new BigNumber(10).pow(destAsset.decimals),
        ),
        fiatAmount: new BigNumber(destTokenAmount)
          .dividedBy(new BigNumber(10).pow(destAsset.decimals))
          .times(fiatRates[destAsset.address as Hex] ?? 0)
          .toNumber(),
        usdAmount: 0,
        color: TextColor.SuccessDefault,
      },
    };
  }, [fiatRates, quote, tokenDetails]);

  if (
    !quote ||
    !tokenDetails ||
    !fiatRates ||
    !srcAssetBalanceChange ||
    !destAssetBalanceChange
  ) {
    return null;
  }

  return (
    <SimulationDetailsLayout
      isTransactionsRedesign
      transactionId={transactionId}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={3}>
        <BalanceChangeRow
          label={t('simulationDetailsOutgoingHeading')}
          isFirstRow
          hasIncomingTokens
          confirmationId={currentConfirmation?.id}
          balanceChange={srcAssetBalanceChange}
          showFiat
        />
        <BalanceChangeRow
          label={t('simulationDetailsIncomingHeading')}
          confirmationId={currentConfirmation?.id}
          balanceChange={destAssetBalanceChange}
          showFiat
        />
      </Box>
    </SimulationDetailsLayout>
  );
};
