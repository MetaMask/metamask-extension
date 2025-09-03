import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  BRIDGE_MM_FEE_RATE,
  UnifiedSwapBridgeEventName,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import {
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
  getPriceImpactThresholds,
  getQuoteRequest,
  getIsToOrFromSolana,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
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
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import { formatPriceImpact } from '../utils/price-impact';
import { type DestinationAccount } from '../prepare/types';
import { BridgeQuotesModal } from './bridge-quotes-modal';

const getTimeLabelColor = (timeInSeconds: number) => {
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
  selectedDestinationAccount,
}: {
  onOpenSlippageModal: () => void;
  onOpenRecipientModal: () => void;
  selectedDestinationAccount: DestinationAccount | null;
}) => {
  const t = useI18nContext();
  const { activeQuote, isQuoteGoingToRefresh } = useSelector(getBridgeQuotes);
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

  const isToOrFromSolana = useSelector(getIsToOrFromSolana);

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

  const secondsUntilNextRefresh = useCountdownTimer();

  return (
    <>
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      {activeQuote ? (
        <Column gap={2} style={{ marginTop: 'auto' }}>
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
                  color={getTimeLabelColor(secondsUntilNextRefresh)}
                >
                  {`(0:${secondsUntilNextRefresh < 10 ? '0' : ''}${secondsUntilNextRefresh})`}
                </Text>
              )}

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
                ariaLabel={t('moreQuotes')}
              />
            </Row>
          </Row>

          {/* Network Fee */}
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
                {t('networkFeeExplanation')}
              </Tooltip>
            </Row>
            {activeQuote.quote.gasIncluded && (
              <Row gap={1} data-testid="network-fees-included">
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  style={{ textDecoration: 'line-through' }}
                >
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
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {t('swapGasFeesIncluded')}
                </Text>
              </Row>
            )}
            {!activeQuote.quote.gasIncluded && (
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                data-testid="network-fees"
              >
                {formatCurrencyAmount(
                  activeQuote.totalNetworkFee?.valueInCurrency,
                  currency,
                  2,
                )}
              </Text>
            )}
          </Row>

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

          {/* Minimum Received */}
          {
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
                {formatCurrencyAmount(
                  activeQuote.minToTokenAmount.valueInCurrency,
                  currency,
                  2,
                )}
              </Text>
            </Row>
          }

          {/* Price Impact */}
          {shouldRenderPriceImpactRow && shouldShowPriceImpactWarning && (
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
                    shouldShowPriceImpactWarning
                      ? t('bridgePriceImpactWarningTitle')
                      : t('bridgePriceImpactTooltipTitle')
                  }
                  position={PopoverPosition.TopStart}
                  offset={[-16, 16]}
                >
                  {t('bridgePriceImpactNormalWarning')}
                </Tooltip>
              </Row>
              <Text
                variant={TextVariant.bodySm}
                color={
                  shouldShowPriceImpactWarning
                    ? TextColor.errorDefault
                    : TextColor.textAlternative
                }
              >
                {formatPriceImpact(priceImpact)}
              </Text>
            </Row>
          )}

          {/* Recipient */}
          {isToOrFromSolana && selectedDestinationAccount && (
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
                  {selectedDestinationAccount.displayName}
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
        </Column>
      ) : null}
    </>
  );
};
