/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useState } from 'react';
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
import { QuoteResponse } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { useDappSwapComparisonInfo } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo';
import { useDappSwapComparisonMetrics } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonMetrics';
import { useDappSwapCheck } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapCheck';
import { useDappSwapComparisonRewardText } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText';
import { useDappSwapContext } from '../../../context/dapp-swap';
import { QuoteSwapSimulationDetails } from '../../transactions/quote-swap-simulation-details/quote-swap-simulation-details';
import { NetworkRow } from '../info/shared/network-row/network-row';

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
  const { captureDappSwapComparisonDisplayProperties } =
    useDappSwapComparisonMetrics();
  const { dappSwapUi, dappSwapQa } = useSelector(getRemoteFeatureFlags) as {
    dappSwapUi: DappSwapUiFlag;
    dappSwapQa: { enabled: boolean };
  };
  const { setQuotedSwapDisplayedInInfo, setSelectedQuote } =
    useDappSwapContext();
  const rewards = useDappSwapComparisonRewardText();
  const [selectedSwapType, setSelectedSwapType] = useState<SwapType>(
    SwapType.Current,
  );
  const [showDappSwapComparisonBanner, setShowDappSwapComparisonBanner] =
    useState<boolean>(true);

  const hideDappSwapComparisonBanner = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setShowDappSwapComparisonBanner(false);
    },
    [setShowDappSwapComparisonBanner],
  );

  const updateSwapToCurrent = useCallback(() => {
    setQuotedSwapDisplayedInInfo(false);
    setSelectedSwapType(SwapType.Current);
  }, [setQuotedSwapDisplayedInInfo, setSelectedSwapType]);

  const updateSwapToSelectedQuote = useCallback(() => {
    setQuotedSwapDisplayedInInfo(true);
    captureDappSwapComparisonDisplayProperties({
      swap_mm_opened: 'true',
    });
    setSelectedSwapType(SwapType.Metamask);
    setShowDappSwapComparisonBanner(false);
  }, [
    captureDappSwapComparisonDisplayProperties,
    setQuotedSwapDisplayedInInfo,
    setSelectedSwapType,
    setShowDappSwapComparisonBanner,
    selectedQuote,
  ]);

  const swapComparisonDisplayed =
    dappSwapUi?.enabled &&
    (selectedQuoteValueDifference >=
      (dappSwapUi?.threshold ?? DAPP_SWAP_THRESHOLD) ||
      (dappSwapQa?.enabled && selectedQuote));

  useEffect(() => {
    let dappSwapComparisonDisplayed = false;
    if (swapComparisonDisplayed) {
      dappSwapComparisonDisplayed = true;
    }
    captureDappSwapComparisonDisplayProperties({
      swap_mm_cta_displayed: dappSwapComparisonDisplayed.toString(),
    });
  }, [captureDappSwapComparisonDisplayProperties, swapComparisonDisplayed]);

  useEffect(() => {
    setSelectedQuote(selectedQuote);
  }, [selectedQuote, setSelectedQuote]);

  if (!swapComparisonDisplayed) {
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
          role="button"
          onClick={updateSwapToSelectedQuote}
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
            {rewards && <span>{` • ${rewards.text}`}</span>}
          </Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodyXs}>
            {t('dappSwapBenefits')}
          </Text>
        </Box>
      )}
      {selectedSwapType === SwapType.Metamask && (
        <>
          <QuoteSwapSimulationDetails
            fiatRates={fiatRates}
            quote={selectedQuote as QuoteResponse}
            tokenDetails={tokenDetails}
            sourceTokenAmount={sourceTokenAmount}
            tokenAmountDifference={tokenAmountDifference}
            minDestTokenAmountInUSD={minDestTokenAmountInUSD}
          />
          <ConfirmInfoSection data-testid="transaction-details-section">
            <NetworkRow />
          </ConfirmInfoSection>
        </>
      )}
    </Box>
  );
};

export const DappSwapComparisonBanner = () => {
  const { dappSwapMetrics } = useSelector(getRemoteFeatureFlags);
  const { isSwapToBeCompared } = useDappSwapCheck();

  const dappSwapMetricsEnabled =
    (dappSwapMetrics as { enabled: boolean })?.enabled === true &&
    isSwapToBeCompared;

  if (!dappSwapMetricsEnabled) {
    return null;
  }

  return <DappSwapComparisonInner />;
};
