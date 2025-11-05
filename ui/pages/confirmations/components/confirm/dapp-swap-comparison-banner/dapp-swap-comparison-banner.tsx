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
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapComparisonInfo } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo';

const DAPP_SWAP_COMPARISON_ORIGIN = 'https://app.uniswap.org';
const DAPP_SWAP_THRESHOLD = 0.01;

const enum SwapType {
  Current = 'current',
  Metamask = 'metamask',
}

const enum SwapButtonType {
  Text = 'text',
  ButtonType = 'button',
}

const SwapButton = ({
  type,
  label,
  onClick,
}: {
  type: SwapButtonType;
  label: string;
  onClick: () => void;
}) => {
  if (type === SwapButtonType.ButtonType) {
    return (
      <Button
        className="dapp-swap_highlighted-button"
        size={ButtonSize.Md}
        variant={ButtonVariant.Secondary}
        onClick={onClick}
      >
        {label}
      </Button>
    );
  }
  return (
    <TextButton className="dapp-swap_text-button" onClick={onClick}>
      {label}
    </TextButton>
  );
};

const DappSwapComparisonInner = () => {
  const t = useI18nContext();
  const {
    selectedQuoteValueDifference,
    gasDifference,
    tokenAmountDifference,
    destinationTokenSymbol,
  } = useDappSwapComparisonInfo();
  const [selectedSwapType, setSelectedSwapType] = useState<SwapType>(
    SwapType.Current,
  );
  const [showDappSwapComparisonBanner, setShowDappSwapComparisonBanner] =
    useState<boolean>(true);

  const hideDappSwapComparisonBanner = useCallback(() => {
    setShowDappSwapComparisonBanner(false);
  }, [setShowDappSwapComparisonBanner]);

  if (
    process.env.DAPP_SWAP_SHIELD_ENABLED?.toString() !== 'true' ||
    selectedQuoteValueDifference < DAPP_SWAP_THRESHOLD
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
          type={
            selectedSwapType === SwapType.Current
              ? SwapButtonType.ButtonType
              : SwapButtonType.Text
          }
          onClick={() => setSelectedSwapType(SwapType.Current)}
          label={t('current')}
        />
        <SwapButton
          type={
            selectedSwapType === SwapType.Metamask
              ? SwapButtonType.ButtonType
              : SwapButtonType.Text
          }
          onClick={() => setSelectedSwapType(SwapType.Metamask)}
          label={t('saveAndEarn')}
        />
      </Box>
      {showDappSwapComparisonBanner && (
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
          {dappTypeSelected && (
            <>
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
                variant={TextVariant.BodySm}
              >
                {t('dappSwapQuoteDifference', [
                  `$${(gasDifference + tokenAmountDifference).toFixed(2)}`,
                ])}
              </Text>
            </>
          )}
          {!dappTypeSelected && (
            <Text className="dapp-swap_text-save" variant={TextVariant.BodySm}>
              {t('dappSwapQuoteDetails', [
                `$${gasDifference.toFixed(2)}`,
                `$${tokenAmountDifference.toFixed(2)}`,
                destinationTokenSymbol?.toUpperCase(),
              ])}
            </Text>
          )}
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodyXs}>
            {t('dappSwapBenefits')}
          </Text>
        </Box>
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
    transactionMeta.origin === DAPP_SWAP_COMPARISON_ORIGIN;

  if (!dappSwapMetricsEnabled) {
    return null;
  }

  return <DappSwapComparisonInner />;
};
