import React, { useMemo } from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
import { QuoteResponse } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';

import { TokenStandAndDetails } from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { calculateTokenAmount } from '../../../utils/token';
import { getTokenValueFromRecord } from '../../../utils/dapp-swap-comparison-utils';
import { useConfirmContext } from '../../../context/confirm';
import { SimulationDetailsLayout } from '../../simulation-details/simulation-details';
import { BalanceChangeRow } from '../../simulation-details/balance-change-row';
import { TokenAssetIdentifier } from '../../simulation-details/types';

const getSrcAssetBalanceChange = (
  srcAsset: QuoteResponse['quote']['srcAsset'],
  tokenDetails: Record<Hex, TokenStandAndDetails>,
  sourceTokenAmount: string | undefined,
  fiatRates: Record<Hex, number | undefined>,
) => {
  return {
    asset: {
      ...tokenDetails[srcAsset.address.toLowerCase() as Hex],
      chainId: toHex(srcAsset.chainId),
      address: srcAsset.address as Hex,
    } as unknown as TokenAssetIdentifier,
    amount: calculateTokenAmount(
      sourceTokenAmount ?? '0x0',
      srcAsset.decimals,
      16,
    ).negated(),
    fiatAmount: calculateTokenAmount(
      sourceTokenAmount ?? '0x0',
      srcAsset.decimals,
      16,
      getTokenValueFromRecord(fiatRates, srcAsset.address as Hex) ?? 0,
    )
      .negated()
      .toNumber(),
    usdAmount: 0,
  };
};

const getDestAssetBalanceChange = (
  destAsset: QuoteResponse['quote']['destAsset'],
  tokenDetails: Record<Hex, TokenStandAndDetails>,
  destTokenAmount: string,
  fiatRates: Record<Hex, number | undefined>,
) => {
  return {
    asset: {
      ...tokenDetails[destAsset.address.toLowerCase() as Hex],
      chainId: toHex(destAsset.chainId),
      address: destAsset.address as Hex,
    } as unknown as TokenAssetIdentifier,
    amount: calculateTokenAmount(destTokenAmount, destAsset.decimals),
    fiatAmount: calculateTokenAmount(
      destTokenAmount,
      destAsset.decimals,
      10,
      getTokenValueFromRecord(fiatRates, destAsset.address as Hex) ?? 0,
    ).toNumber(),
    usdAmount: 0,
  };
};
export const QuoteSwapSimulationDetails = ({
  fiatRates,
  quote,
  sourceTokenAmount,
  tokenDetails,
}: {
  fiatRates?: Record<Hex, number | undefined>;
  quote?: QuoteResponse;
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
    const { srcAsset, destAsset, destTokenAmount } = quote.quote;
    return {
      srcAssetBalanceChange: getSrcAssetBalanceChange(
        srcAsset,
        tokenDetails,
        sourceTokenAmount,
        fiatRates,
      ),
      destAssetBalanceChange: getDestAssetBalanceChange(
        destAsset,
        tokenDetails,
        destTokenAmount,
        fiatRates,
      ),
    };
  }, [fiatRates, quote, sourceTokenAmount, tokenDetails]);

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
      title={t('bestQuote')}
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        data-testid="quote-swap-simulation-details"
      >
        <BalanceChangeRow
          balanceChange={srcAssetBalanceChange}
          confirmationId={currentConfirmation?.id}
          isFirstRow
          label={t('simulationDetailsOutgoingHeading')}
          showFiat
        />
        <BalanceChangeRow
          balanceChange={destAssetBalanceChange}
          hasIncomingTokens
          confirmationId={currentConfirmation?.id}
          label={t('simulationDetailsIncomingHeading')}
          showFiat
        />
      </Box>
    </SimulationDetailsLayout>
  );
};
