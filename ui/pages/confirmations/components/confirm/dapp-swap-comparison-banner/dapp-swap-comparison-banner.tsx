/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { QuoteResponse } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { Tab, Tabs } from '../../../../../components/ui/tabs';
import { useDappSwapComparisonInfo } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo';
import { useDappSwapComparisonMetrics } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonMetrics';
import { useDappSwapCheck } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapCheck';
import { useDappSwapComparisonRewardText } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText';
import { useDappSwapContext } from '../../../context/dapp-swap';
import { QuoteSwapSimulationDetails } from '../../transactions/quote-swap-simulation-details/quote-swap-simulation-details';
import { NetworkRow } from '../info/shared/network-row/network-row';

type DappSwapUiFlag = {
  enabled: boolean;
  threshold: number;
};

const enum SwapType {
  Current = 'current',
  Metamask = 'metamask',
}

// Swaps tabs are memoized to prevent animation jitter in MMSwap tab
const SwapTabs = React.memo(
  ({
    onTabClick,
    activeTabKey,
  }: {
    onTabClick: (key: SwapType) => void;
    activeTabKey: SwapType;
  }) => {
    const t = useI18nContext();

    return (
      <Tabs
        defaultActiveTabKey={activeTabKey}
        activeTabKey={activeTabKey}
        onTabClick={onTabClick}
        tabListProps={{
          className: 'dapp-swap__tabs',
        }}
      >
        <Tab
          tabKey={SwapType.Current}
          name={t('marketRate')}
          className="flex-1"
          data-testid="market-rate-tab"
        />
        <Tab
          tabKey={SwapType.Metamask}
          name={t('metamaskSwap')}
          className="flex-1 animate-mm-swap-text"
          data-testid="metamask-swap-tab"
        />
      </Tabs>
    );
  },
);

const DappSwapComparisonInner = () => {
  const t = useI18nContext();
  const {
    fiatRates,
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
  }, [
    captureDappSwapComparisonDisplayProperties,
    setQuotedSwapDisplayedInInfo,
    setSelectedSwapType,
    selectedQuote,
  ]);

  const onTabClick = useCallback(
    (tabKey: SwapType) => {
      if (tabKey === SwapType.Current) {
        updateSwapToCurrent();
      } else if (tabKey === SwapType.Metamask) {
        updateSwapToSelectedQuote();
      }
    },
    [updateSwapToCurrent, updateSwapToSelectedQuote],
  );

  const swapComparisonDisplayed =
    dappSwapUi?.enabled &&
    (selectedQuoteValueDifference >= dappSwapUi?.threshold ||
      (dappSwapQa?.enabled && selectedQuote));

  useEffect(() => {
    if (swapComparisonDisplayed) {
      captureDappSwapComparisonDisplayProperties({
        swap_mm_cta_displayed: 'true',
      });
    }
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
      <SwapTabs onTabClick={onTabClick} activeTabKey={selectedSwapType} />
      {showDappSwapComparisonBanner && (
        <Box
          className="dapp-swap_callout"
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          marginBottom={4}
          padding={3}
          role="button"
          onClick={updateSwapToSelectedQuote}
        >
          {dappTypeSelected && (
            <>
              <ButtonIcon
                className="dapp-swap_close-button"
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                onClick={hideDappSwapComparisonBanner}
                ariaLabel="close-dapp-swap-comparison-banner"
              />
              <div className="dapp-swap_callout-arrow" />
            </>
          )}
          <Text
            className="dapp-swap_callout-text"
            color={TextColor.TextDefault}
            variant={TextVariant.BodySm}
          >
            {rewards ? t('dappSwapAdvantage') : t('dappSwapAdvantageSaveOnly')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
            marginBottom={2}
          >
            <Text color={TextColor.SuccessDefault} variant={TextVariant.BodyXs}>
              {t('dappSwapQuoteDifference', [
                `$${selectedQuoteValueDifference.toFixed(2)}`,
              ])}
            </Text>
            {rewards && (
              <>
                <Text
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodyXs}
                >
                  {` • `}
                </Text>
                <Text
                  className="dapp-swap_text-rewards"
                  variant={TextVariant.BodyXs}
                >
                  {rewards.text}
                </Text>
              </>
            )}
          </Box>
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
  const { isSwapToBeCompared } = useDappSwapCheck();

  if (!isSwapToBeCompared) {
    return null;
  }

  return <DappSwapComparisonInner />;
};
