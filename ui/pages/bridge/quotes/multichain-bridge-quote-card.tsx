import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  BRIDGE_MM_FEE_RATE,
  formatEtaInMinutes,
  UnifiedSwapBridgeEventName,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import {
  Text,
  PopoverPosition,
  IconName,
  ButtonLink,
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
  getPriceImpactThresholds,
  getQuoteRequest,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  BlockSize,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Row, Column, Tooltip } from '../layout';
import { trackUnifiedSwapBridgeEvent } from '../../../ducks/bridge/actions';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { formatPriceImpact } from '../utils/price-impact';
import { BridgeQuotesModal } from './bridge-quotes-modal';

export const MultichainBridgeQuoteCard = ({
  onOpenSlippageModal,
}: {
  onOpenSlippageModal?: () => void;
}) => {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);

  const { insufficientBal } = useSelector(getQuoteRequest);
  const fromChain = useSelector(getFromChain);
  const locale = useSelector(getIntlLocale);
  const isStxEnabled = useSelector((state) =>
    getIsSmartTransaction(state as never, fromChain?.chainId),
  );
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const slippage = useSelector(getSlippage);
  const isSolanaSwap = useSelector(getIsSolanaSwap);
  const dispatch = useDispatch();

  const [showAllQuotes, setShowAllQuotes] = useState(false);

  const priceImpactThresholds = useSelector(getPriceImpactThresholds);

  // Calculate if price impact warning should show
  const priceImpact = activeQuote?.quote?.priceData?.priceImpact;
  const gasIncluded = activeQuote?.quote?.gasIncluded ?? false;

  const shouldRenderPriceImpactRow = useMemo(() => {
    const priceImpactThreshold = priceImpactThresholds;
    return (
      priceImpactThreshold && priceImpact !== undefined && priceImpact !== null
    );
  }, [priceImpactThresholds, priceImpact]);

  // Red state if above threshold
  const shouldShowPriceImpactWarning = React.useMemo(() => {
    if (!shouldRenderPriceImpactRow) {
      return false;
    }
    const threshold = gasIncluded
      ? priceImpactThresholds?.gasless
      : priceImpactThresholds?.normal;
    if (threshold === null || threshold === undefined) {
      return false;
    }
    return Number(priceImpact) >= Number(threshold);
  }, [
    gasIncluded,
    priceImpact,
    shouldRenderPriceImpactRow,
    priceImpactThresholds,
  ]);

  return (
    <>
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      {activeQuote ? (
        <Column gap={3}>
          {/* Rate */}
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row gap={1}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
              >
                {t('multichainQuoteCardRateLabel')}
              </Text>
              <Tooltip
                title={t('multichainQuoteCardRateLabel')}
                position={PopoverPosition.TopStart}
                offset={[-16, 16]}
              >
                {t('multichainQuoteCardRateExplanation', [
                  new BigNumber(activeQuote.quote.feeData.metabridge.amount).gt(
                    0,
                  )
                    ? BRIDGE_MM_FEE_RATE
                    : '0',
                ])}
              </Tooltip>
            </Row>
            <Text>
              {`1 ${activeQuote.quote.srcAsset.symbol} = ${formatTokenAmount(
                locale,
                activeQuote.swapRate,
              )} ${activeQuote.quote.destAsset.symbol}`}
            </Text>
          </Row>

          {/* Network Fee */}
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row gap={1}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
              >
                {t('networkFee')}
              </Text>
              <Tooltip
                title={t('networkFeeExplanationTitle')}
                position={PopoverPosition.TopStart}
                offset={[-16, 16]}
              >
                {t('networkFeeExplanation')}
              </Tooltip>
            </Row>
            {activeQuote.quote.gasIncluded && (
              <Row gap={1} data-testid="network-fees-included">
                <Text style={{ textDecoration: 'line-through' }}>
                  {activeQuote.includedTxFees?.valueInCurrency
                    ? formatCurrencyAmount(
                        activeQuote.includedTxFees.valueInCurrency,
                        currency,
                        2,
                      )
                    : formatCurrencyAmount(
                        activeQuote.totalNetworkFee?.valueInCurrency,
                        currency,
                        2,
                      )}
                </Text>
                <Text variant={TextVariant.bodyMd}>
                  {t('swapGasFeesIncluded')}
                </Text>
              </Row>
            )}
            {!activeQuote.quote.gasIncluded && (
              <Text data-testid="network-fees">
                {formatCurrencyAmount(
                  activeQuote.totalNetworkFee?.valueInCurrency,
                  currency,
                  2,
                )}
              </Text>
            )}
          </Row>

          {/* Price Impact */}
          {shouldRenderPriceImpactRow && (
            <Row justifyContent={JustifyContent.spaceBetween}>
              <Row gap={1}>
                <Text
                  variant={TextVariant.bodyMd}
                  color={TextColor.textAlternative}
                >
                  {t('bridgePriceImpact')}
                </Text>
                <Tooltip
                  title={
                    shouldShowPriceImpactWarning
                      ? t('bridgePriceImpactWarningTitle')
                      : t('bridgePriceImpactTooltipTitle')
                  }
                  position={PopoverPosition.TopStart}
                  offset={[-16, 16]}
                >
                  {t(
                    gasIncluded
                      ? 'bridgePriceImpactGaslessWarning'
                      : 'bridgePriceImpactNormalWarning',
                  )}
                </Tooltip>
              </Row>
              <Text
                variant={TextVariant.bodyMd}
                color={
                  shouldShowPriceImpactWarning
                    ? TextColor.errorDefault
                    : TextColor.textDefault
                }
              >
                {formatPriceImpact(priceImpact)}
              </Text>
            </Row>
          )}

          {/* Slippage */}
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row gap={1}>
              <Text
                variant={TextVariant.bodyMd}
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
              <Text variant={TextVariant.bodyMd}>
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

          {/* Time */}
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {t('multichainQuoteCardTimeLabel')}
            </Text>
            <Text>
              {t('bridgeTimingMinutes', [
                formatEtaInMinutes(
                  activeQuote.estimatedProcessingTimeInSeconds,
                ),
              ])}
            </Text>
          </Row>

          {/* Minimum Received */}
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row gap={1}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
              >
                {t('minimumReceivedLabel')}
              </Text>
              <Tooltip
                width={BlockSize.Max}
                title={t('minimumReceivedExplanationTitle')}
                position={PopoverPosition.TopStart}
                offset={[-48, 16]}
              >
                {t('minimumReceivedExplanation')}
              </Tooltip>
            </Row>
            <Text data-testid="minimum-received">
              {formatCurrencyAmount(
                activeQuote.minToTokenAmount.valueInCurrency,
                currency,
                2,
              )}
            </Text>
          </Row>

          {/* Footer */}
          <Row
            justifyContent={JustifyContent.spaceBetween}
            color={TextColor.textAlternative}
          >
            <Text variant={TextVariant.bodyMd}>
              {new BigNumber(activeQuote.quote.feeData.metabridge.amount).gt(0)
                ? t('rateIncludesMMFee', [BRIDGE_MM_FEE_RATE])
                : ''}
            </Text>
            <ButtonLink
              variant={TextVariant.bodyMd}
              onClick={() => {
                fromChain?.chainId &&
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
                        price_impact: Number(
                          activeQuote.quote?.priceData?.priceImpact ?? '0',
                        ),
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        gas_included: Boolean(activeQuote.quote?.gasIncluded),
                      },
                    ),
                  );
                setShowAllQuotes(true);
              }}
            >
              {t('moreQuotes')}
            </ButtonLink>
          </Row>
        </Column>
      ) : null}
    </>
  );
};
