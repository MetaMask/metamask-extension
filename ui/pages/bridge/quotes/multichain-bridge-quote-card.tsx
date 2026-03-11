import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  BRIDGE_MM_FEE_RATE,
  UnifiedSwapBridgeEventName,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { bpsToPercentage } from '../../../ducks/bridge/utils';
import {
  SuccessPill,
  Text,
  PopoverPosition,
  IconName,
  ButtonIcon,
  ButtonIconSize,
} from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromChain,
  getToToken,
  getFromToken,
  getSlippage,
  getIsSolanaSwap,
  getQuoteRequest,
  getIsToOrFromNonEvm,
  getIsStxEnabled,
  getValidationErrors,
  getPriceImpact,
  getFormattedPriceImpact,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatNetworkFee, formatTokenAmount } from '../utils/quote';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Row, Column, Tooltip } from '../layout';
import { trackUnifiedSwapBridgeEvent } from '../../../ducks/bridge/actions';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import { type DestinationAccount } from '../prepare/types';
import { useRewards } from '../../../hooks/bridge/useRewards';
import { RewardsBadge } from '../../../components/app/rewards/RewardsBadge';
import AddRewardsAccount from '../../../components/app/rewards/AddRewardsAccount';
import { Skeleton } from '../../../components/component-library/skeleton';
import { getGasFeesSponsoredNetworkEnabled } from '../../../selectors/selectors';
import { BridgeQuotesModal } from './bridge-quotes-modal';

const getTimerColor = (timeInSeconds: number) => {
  if (timeInSeconds <= 3) {
    return TextColor.errorDefault;
  }

  if (timeInSeconds <= 5) {
    return TextColor.warningDefault;
  }

  return TextColor.textAlternative;
};

export const MultichainBridgeQuoteCard = ({
  onOpenSlippageModal,
  onOpenRecipientModal,
  onOpenPriceImpactWarningModal,
  selectedDestinationAccount,
}: {
  onOpenSlippageModal: () => void;
  onOpenRecipientModal: () => void;
  onOpenPriceImpactWarningModal: () => void;
  selectedDestinationAccount: DestinationAccount | null;
}) => {
  const t = useI18nContext();
  const {
    activeQuote,
    isQuoteGoingToRefresh,
    isLoading: isQuoteLoading,
  } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);

  const { insufficientBal } = useSelector(getQuoteRequest);
  const fromChain = useSelector(getFromChain);
  const locale = useSelector(getIntlLocale);
  const isStxEnabled = useSelector(getIsStxEnabled);
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const slippage = useSelector(getSlippage);
  const isSolanaSwap = useSelector(getIsSolanaSwap);
  const dispatch = useDispatch();
  const { isEstimatedReturnLow, isPriceImpactWarning, isPriceImpactError } =
    useSelector(getValidationErrors, shallowEqual);

  const isToOrFromNonEvm = useSelector(getIsToOrFromNonEvm);
  const gasFeesSponsoredNetworkEnabled = useSelector(
    getGasFeesSponsoredNetworkEnabled,
  );

  const priceImpact = useSelector(getPriceImpact);
  const formattedPriceImpact = useSelector(getFormattedPriceImpact);

  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const gasSponsored = activeQuote?.quote?.gasSponsored ?? false;

  const isCurrentNetworkGasSponsored = useMemo(() => {
    if (!fromChain?.chainId || !gasFeesSponsoredNetworkEnabled) {
      return false;
    }
    return Boolean(
      gasFeesSponsoredNetworkEnabled[
        fromChain.chainId as keyof typeof gasFeesSponsoredNetworkEnabled
      ],
    );
  }, [fromChain?.chainId, gasFeesSponsoredNetworkEnabled]);

  const shouldShowGasSponsored = useMemo(() => {
    if (gasSponsored) {
      return true;
    }

    // For the insufficientBal workaround, validate it's a same-chain swap
    if (insufficientBal && isCurrentNetworkGasSponsored) {
      // Gas sponsorship only applies to same-chain swaps, not cross-chain bridges
      const isSameChain =
        fromToken?.chainId &&
        toToken?.chainId &&
        fromToken.chainId === toToken.chainId;
      return Boolean(isSameChain);
    }

    return false;
  }, [
    gasSponsored,
    insufficientBal,
    isCurrentNetworkGasSponsored,
    fromToken?.chainId,
    toToken?.chainId,
  ]);

  const nativeTokenSymbol = fromChain
    ? getNativeAssetForChainId(fromChain.chainId).symbol
    : '';

  const secondsUntilNextRefresh = useCountdownTimer();

  const {
    isLoading: isRewardsLoading,
    estimatedPoints,
    shouldShowRewardsRow,
    hasError: hasRewardsError,
    rewardsAccountScope,
    accountOptedIn: rewardsAccountOptedIn,
  } = useRewards({
    activeQuote: isQuoteLoading ? null : (activeQuote?.quote ?? null),
  });

  if (!activeQuote) {
    return null;
  }

  return (
    <>
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      <Column gap={2}>
        {/* Rate and timer */}
        <Row justifyContent={JustifyContent.spaceBetween}>
          <Row gap={2}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {t('multichainQuoteCardRateLabel')}
            </Text>

            {isQuoteGoingToRefresh && (
              <Text
                variant={TextVariant.bodySm}
                color={getTimerColor(secondsUntilNextRefresh)}
                style={{ width: 32 }}
              >
                {`0:${secondsUntilNextRefresh < 10 ? '0' : ''}${secondsUntilNextRefresh}`}
              </Text>
            )}

            <Tooltip
              title={t('multichainQuoteCardRateLabel')}
              position={PopoverPosition.TopStart}
              offset={[-16, 16]}
            >
              {t('multichainQuoteCardRateExplanation', [
                new BigNumber(activeQuote.quote.feeData.metabridge.amount).gt(0)
                  ? (bpsToPercentage(
                      // @ts-expect-error: controller types are not up to date yet
                      activeQuote.quote.feeData.metabridge.quoteBpsFee,
                    ) ?? BRIDGE_MM_FEE_RATE)
                  : '0',
              ])}
            </Tooltip>
          </Row>
          <Row gap={1}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {`1 ${activeQuote.quote.srcAsset.symbol} = ${formatTokenAmount(
                locale,
                activeQuote.swapRate,
              )} ${activeQuote.quote.destAsset.symbol}`}
            </Text>
            <ButtonIcon
              iconName={IconName.ArrowRight}
              size={ButtonIconSize.Sm}
              color={IconColor.iconAlternative}
              onClick={() => {
                activeQuote &&
                  dispatch(
                    trackUnifiedSwapBridgeEvent(
                      UnifiedSwapBridgeEventName.AllQuotesOpened,
                      {
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        can_submit: !insufficientBal,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        stx_enabled: isStxEnabled,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        token_symbol_source:
                          fromToken?.symbol ??
                          getNativeAssetForChainId(fromChain.chainId).symbol,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        token_symbol_destination: toToken?.symbol ?? null,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        price_impact: priceImpact ?? 0,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        gas_included: Boolean(activeQuote.quote?.gasIncluded),
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // @ts-expect-error gas_included_7702 needs to be added to bridge-controller types
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        gas_included_7702: Boolean(
                          activeQuote.quote?.gasIncluded7702,
                        ),
                      },
                    ),
                  );
                setShowAllQuotes(true);
              }}
              ariaLabel={t('moreQuotes')}
            />
          </Row>
        </Row>

        {/* Network Fee - Hide if zero/undefined for non-EVM chains (e.g., Bitcoin with no gas.) */}
        {(!isToOrFromNonEvm ||
          (activeQuote.totalNetworkFee?.valueInCurrency &&
            activeQuote.totalNetworkFee.valueInCurrency !== '0')) && (
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row gap={2}>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('networkFee')}
              </Text>
              <Tooltip
                title={t('networkFeeExplanationTitle')}
                position={PopoverPosition.TopStart}
                offset={[-16, 16]}
              >
                {shouldShowGasSponsored
                  ? t('swapGasFeesSponsoredExplanation', [nativeTokenSymbol])
                  : t('networkFeeExplanation')}
              </Tooltip>
            </Row>
            {shouldShowGasSponsored && (
              <Row gap={1} data-testid="network-fees-sponsored">
                <SuccessPill label={t('swapGasFeesSponsored')} />
              </Row>
            )}
            {!shouldShowGasSponsored && activeQuote.quote.gasIncluded && (
              <Row gap={1} data-testid="network-fees-included">
                <Text
                  variant={TextVariant.bodySm}
                  color={
                    isEstimatedReturnLow
                      ? TextColor.warningDefault
                      : TextColor.textAlternative
                  }
                  style={{ textDecoration: 'line-through' }}
                  data-testid="network-fees-included-original-amount"
                >
                  {activeQuote.includedTxFees?.valueInCurrency
                    ? formatNetworkFee(
                        activeQuote.includedTxFees.valueInCurrency,
                        currency,
                      )
                    : formatNetworkFee(
                        activeQuote.gasFee.effective?.valueInCurrency,
                        currency,
                      )}
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color={
                    isEstimatedReturnLow
                      ? TextColor.warningDefault
                      : TextColor.textAlternative
                  }
                >
                  {t('swapGasFeesIncluded')}
                </Text>
              </Row>
            )}
            {!shouldShowGasSponsored && !activeQuote.quote.gasIncluded && (
              <Text
                variant={TextVariant.bodySm}
                color={
                  isEstimatedReturnLow
                    ? TextColor.warningDefault
                    : TextColor.textAlternative
                }
                data-testid="network-fees"
              >
                {formatNetworkFee(
                  activeQuote.gasFee.effective?.valueInCurrency,
                  currency,
                )}
              </Text>
            )}
          </Row>
        )}

        {/* Slippage */}
        <Row justifyContent={JustifyContent.spaceBetween}>
          <Row gap={2}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {t('slippage')}
            </Text>
            <Tooltip
              title={t('slippage')}
              position={PopoverPosition.TopStart}
              offset={[-16, 16]}
            >
              {t('slippageExplanation')}
            </Tooltip>
          </Row>
          <Row gap={1}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {slippage === undefined && isSolanaSwap
                ? t('slippageAuto')
                : `${slippage}%`}
            </Text>
            <ButtonIcon
              iconName={IconName.Edit}
              size={ButtonIconSize.Sm}
              color={IconColor.iconAlternative}
              onClick={onOpenSlippageModal}
              ariaLabel={t('slippageEditAriaLabel')}
              data-testid="slippage-edit-button"
            />
          </Row>
        </Row>

        {/* Price Impact */}
        <Row justifyContent={JustifyContent.spaceBetween}>
          <Row gap={2}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {t('bridgePriceImpact')}
            </Text>
            <Tooltip
              title={
                isPriceImpactWarning || isPriceImpactError
                  ? t('bridgePriceImpactWarningTitle')
                  : t('bridgePriceImpactTooltipTitle')
              }
              position={PopoverPosition.TopStart}
              offset={[-16, 16]}
            >
              {t('bridgePriceImpactNormalDescription')}
            </Tooltip>
          </Row>
          <Row gap={1}>
            {(isPriceImpactWarning || isPriceImpactError) && (
              <ButtonIcon
                iconName={
                  isPriceImpactWarning ? IconName.Warning : IconName.Danger
                }
                size={ButtonIconSize.Sm}
                color={
                  isPriceImpactWarning
                    ? IconColor.warningDefault
                    : IconColor.errorDefault
                }
                onClick={onOpenPriceImpactWarningModal}
                ariaLabel={t('bridgePriceImpactWarningAriaLabel')}
                data-testid="price-impact-warning-button"
              />
            )}
            <Text
              variant={TextVariant.bodySm}
              color={
                // eslint-disable-next-line no-nested-ternary
                isPriceImpactWarning
                  ? TextColor.warningDefault
                  : isPriceImpactError
                    ? TextColor.errorDefault
                    : TextColor.textAlternative
              }
            >
              {formattedPriceImpact}
            </Text>
          </Row>
        </Row>

        {/* Minimum Received */}
        {activeQuote.minToTokenAmount.amount && (
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row gap={2}>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('minimumReceivedLabel')}
              </Text>
              <Tooltip
                style={{ width: 350 }}
                title={t('minimumReceivedExplanationTitle')}
                position={PopoverPosition.TopStart}
                offset={[-48, 16]}
              >
                {t('minimumReceivedExplanation')}
              </Tooltip>
            </Row>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              data-testid="minimum-received"
            >
              {formatTokenAmount(
                locale,
                activeQuote.minToTokenAmount.amount,
                activeQuote.quote.destAsset.symbol,
              )}
            </Text>
          </Row>
        )}

        {/* Recipient */}
        {isToOrFromNonEvm && selectedDestinationAccount && (
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {t('recipient')}
            </Text>
            <Row gap={1}>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {`${selectedDestinationAccount.walletName ? `${selectedDestinationAccount.walletName} / ` : ''}${selectedDestinationAccount.displayName}`}
              </Text>
              <ButtonIcon
                iconName={IconName.Edit}
                size={ButtonIconSize.Sm}
                color={IconColor.iconAlternative}
                onClick={onOpenRecipientModal}
                ariaLabel={t('recipientEditAriaLabel')}
                data-testid="recipient-edit-button"
              />
            </Row>
          </Row>
        )}

        {/* Estimated Rewards Points */}
        {shouldShowRewardsRow && (
          <Row
            justifyContent={JustifyContent.spaceBetween}
            data-testid="rewards-row"
          >
            <Row gap={2}>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('bridgePoints')}
              </Text>
              <Tooltip
                title={t('bridgePoints_tooltip')}
                position={PopoverPosition.TopStart}
                offset={[-16, 16]}
              >
                {`${t('bridgePoints_tooltip_content_1')}\n\n${t('bridgePoints_tooltip_content_2')}`}
              </Tooltip>
            </Row>
            <Row gap={1}>
              {isRewardsLoading || isQuoteLoading ? (
                <Skeleton
                  width={100}
                  height={16}
                  data-testid="rewards-loading-skeleton"
                />
              ) : null}
              {!isRewardsLoading && !isQuoteLoading && hasRewardsError && (
                <Row data-testid="rewards-error-state">
                  <RewardsBadge
                    formattedPoints={t('bridgePoints_couldntLoad')}
                    withPointsSuffix={false}
                    boxClassName="gap-1 bg-background-transparent"
                    textClassName="text-alternative"
                    useAlternativeIconColor
                  />
                  <Tooltip
                    title={t('bridgePoints_error')}
                    iconName={IconName.Warning}
                    color={IconColor.warningDefault}
                    position={PopoverPosition.TopEnd}
                    offset={[-16, 16]}
                    style={{ width: 350 }}
                  >
                    {t('bridgePoints_error_content')}
                  </Tooltip>
                </Row>
              )}
              {!isRewardsLoading && !isQuoteLoading && !hasRewardsError && (
                <>
                  {rewardsAccountScope && rewardsAccountOptedIn === false ? (
                    <AddRewardsAccount account={rewardsAccountScope} />
                  ) : (
                    <RewardsBadge
                      formattedPoints={new Intl.NumberFormat(locale).format(
                        estimatedPoints ?? 0,
                      )}
                      withPointsSuffix={false}
                      boxClassName="gap-1 bg-background-transparent"
                      textClassName="text-alternative"
                      useAlternativeIconColor={!estimatedPoints}
                    />
                  )}
                </>
              )}
            </Row>
          </Row>
        )}
      </Column>
    </>
  );
};
