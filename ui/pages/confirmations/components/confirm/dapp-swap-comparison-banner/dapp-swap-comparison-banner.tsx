import React, { useCallback, useState } from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxBorderColor,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  BatchTransaction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { QuoteResponse, TxData } from '@metamask/bridge-controller';
import { toHex } from '@metamask/controller-utils';
import { useDispatch, useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { updateTransaction } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapComparisonInfo } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo';
import { QuoteSwapSimulationDetails } from '../../transactions/quote-swap-simulation-details/quote-swap-simulation-details';

const DAPP_SWAP_COMPARISON_ORIGIN = 'https://app.uniswap.org';
const TEST_DAPP_ORIGIN = 'https://metamask.github.io';
const DAPP_SWAP_THRESHOLD = 0.01;

type DappSwapUiFlag = {
  enabled: boolean;
  threshold: number;
};

const enum SwapType {
  Current = 'current',
  Metamask = 'metamask',
}

const enum SwapButtonType {
  Text = 'text',
  ButtonType = 'button',
}

const SwapButton = ({
  className = '',
  type,
  label,
  onClick,
}: {
  className?: string;
  type: SwapButtonType;
  label: string;
  onClick: () => void;
}) => {
  if (type === SwapButtonType.ButtonType) {
    return (
      <Button
        className={`dapp-swap_rounded-button ${className}`}
        size={ButtonSize.Md}
        variant={ButtonVariant.Secondary}
        onClick={onClick}
      >
        {label}
      </Button>
    );
  }
  return (
    <TextButton
      className={`dapp-swap_text-button ${className}`}
      onClick={onClick}
    >
      {label}
    </TextButton>
  );
};

const DappSwapComparisonInner = () => {
  const t = useI18nContext();
  const {
    fiatRates,
    gasDifference,
    minDestTokenAmountInUSD,
    selectedQuote,
    selectedQuoteValueDifference,
    sourceTokenAmount,
    tokenAmountDifference,
    tokenDetails,
  } = useDappSwapComparisonInfo();

  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { dappSwapUi } = useSelector(getRemoteFeatureFlags) as {
    dappSwapUi: DappSwapUiFlag;
  };

  // update selectedSwapType depending on data
  const [selectedSwapType, setSelectedSwapType] = useState<SwapType>(
    SwapType.Current,
  );
  const [showDappSwapComparisonBanner, setShowDappSwapComparisonBanner] =
    useState<boolean>(true);

  const hideDappSwapComparisonBanner = useCallback(() => {
    setShowDappSwapComparisonBanner(false);
  }, [setShowDappSwapComparisonBanner]);

  const updateSwapToCurrent = useCallback(() => {
    setSelectedSwapType(SwapType.Current);
    setShowDappSwapComparisonBanner(true);
    if (currentConfirmation.txParamsOriginal) {
      dispatch(
        updateTransaction(
          {
            ...currentConfirmation,
            txParams: currentConfirmation.txParamsOriginal,
            batchTransactions: undefined,
          },
          false,
        ),
      );
    }
  }, [
    currentConfirmation,
    dispatch,
    setSelectedSwapType,
    setShowDappSwapComparisonBanner,
  ]);

  const updateSwapToSelectedQuote = useCallback(() => {
    setSelectedSwapType(SwapType.Metamask);
    setShowDappSwapComparisonBanner(true);
    const { value, gasLimit, data } = selectedQuote?.trade as TxData;
    dispatch(
      updateTransaction(
        {
          ...currentConfirmation,
          txParams: {
            ...currentConfirmation.txParams,
            value,
            gas: toHex(gasLimit ?? 0),
            data,
          },
          txParamsOriginal: currentConfirmation.txParams,
          batchTransactions: [selectedQuote?.approval as BatchTransaction],
        },
        false,
      ),
    );
  }, [
    currentConfirmation,
    dispatch,
    setSelectedSwapType,
    setShowDappSwapComparisonBanner,
    selectedQuote,
  ]);

  if (
    !dappSwapUi?.enabled ||
    selectedQuoteValueDifference <
      (dappSwapUi?.threshold ?? DAPP_SWAP_THRESHOLD)
  ) {
    return null;
  }

  const dappTypeSelected = selectedSwapType === SwapType.Current;

  return (
    <Box>
      <Box
        borderColor={BoxBorderColor.BorderMuted}
        borderWidth={1}
        className="dapp-swap_wrapper"
        marginBottom={4}
        marginTop={2}
        padding={1}
      >
        <SwapButton
          className="dapp-swap_dapp-swap-button"
          type={
            selectedSwapType === SwapType.Current
              ? SwapButtonType.ButtonType
              : SwapButtonType.Text
          }
          onClick={updateSwapToCurrent}
          label={t('marketRate')}
        />
        <SwapButton
          className="dapp-swap_mm-swap-button"
          type={
            selectedSwapType === SwapType.Metamask
              ? SwapButtonType.ButtonType
              : SwapButtonType.Text
          }
          onClick={updateSwapToSelectedQuote}
          label={t('metamaskSwap')}
        />
      </Box>
      {showDappSwapComparisonBanner && dappTypeSelected && (
        <Box
          className="dapp-swap_callout"
          backgroundColor={BoxBackgroundColor.BackgroundAlternative}
          marginBottom={4}
          padding={4}
        >
          <ButtonIcon
            className="dapp-swap_close-button"
            iconName={IconName.Close}
            size={ButtonIconSize.Sm}
            onClick={hideDappSwapComparisonBanner}
            ariaLabel="close-dapp-swap-comparison-banner"
          />
          <div className="dapp-swap_callout-arrow" />
          <Text
            className="dapp-swap_callout-text"
            color={TextColor.TextDefault}
            variant={TextVariant.BodySm}
          >
            {t('dappSwapAdvantage')}
          </Text>
          <Text
            className="dapp-swap_text-save"
            color={TextColor.TextAlternative}
            variant={TextVariant.BodyXs}
          >
            {t('dappSwapQuoteDifference', [
              `$${(gasDifference + tokenAmountDifference).toFixed(2)}`,
            ])}
          </Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodyXs}>
            {t('dappSwapBenefits')}
          </Text>
        </Box>
      )}
      {selectedSwapType === SwapType.Metamask && (
        <QuoteSwapSimulationDetails
          fiatRates={fiatRates}
          quote={selectedQuote as QuoteResponse}
          tokenDetails={tokenDetails}
          sourceTokenAmount={sourceTokenAmount}
          tokenAmountDifference={tokenAmountDifference}
          minDestTokenAmountInUSD={minDestTokenAmountInUSD}
        />
      )}
    </Box>
  );
};

export const DappSwapComparisonBanner = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { dappSwapMetrics } = useSelector(getRemoteFeatureFlags);

  const dappSwapMetricsEnabled =
    (dappSwapMetrics as { enabled: boolean })?.enabled === true &&
    (transactionMeta.origin === DAPP_SWAP_COMPARISON_ORIGIN ||
      transactionMeta.origin === TEST_DAPP_ORIGIN);

  if (!dappSwapMetricsEnabled) {
    return null;
  }

  return <DappSwapComparisonInner />;
};
