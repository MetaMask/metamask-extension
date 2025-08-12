import React from 'react';
import { IconName } from '@metamask/snaps-sdk/jsx';
import { useDispatch, useSelector } from 'react-redux';
import { startCase } from 'lodash';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  UnifiedSwapBridgeEventName,
  formatEtaInMinutes,
  formatProviderLabel,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import {
  ButtonLink,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setSelectedQuote,
  setSortOrder,
  trackUnifiedSwapBridgeEvent,
} from '../../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getBridgeSortOrder,
  getFromChain,
  getFromToken,
  getQuoteRequest,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { Column, Row } from '../layout';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { useQuoteProperties } from '../../../hooks/bridge/events/useQuoteProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { useTradeProperties } from '../../../hooks/bridge/events/useTradeProperties';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getMultichainNativeCurrency } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChain = useSelector(getFromChain);
  const { insufficientBal } = useSelector(getQuoteRequest);

  const isStxEnabled = useSelector((state) =>
    getIsSmartTransaction(state as never, fromChain?.chainId),
  );

  const { sortedQuotes, activeQuote, recommendedQuote } =
    useSelector(getBridgeQuotes);
  const sortOrder = useSelector(getBridgeSortOrder);
  const currency = useSelector(getCurrentCurrency);
  const nativeCurrency = useMultichainSelector(getMultichainNativeCurrency);
  const locale = useSelector(getIntlLocale);

  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const quoteListProperties = useQuoteProperties();
  const tradeProperties = useTradeProperties();

  return (
    <Modal className="quotes-modal" onClose={onClose} {...modalProps}>
      <ModalOverlay />

      <ModalContent
        modalDialogProps={{
          padding: 0,
        }}
      >
        <ModalHeader onBack={onClose}>
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {t('swapSelectAQuote')}
          </Text>
        </ModalHeader>

        {/* HEADERS */}
        <Row paddingTop={3} paddingBottom={1} paddingInline={4}>
          {[
            [SortOrder.COST_ASC, t('bridgeNetCost'), IconName.Arrow2Up],
            [SortOrder.ETA_ASC, t('time'), IconName.Arrow2Down],
          ].map(([sortOrderOption, label, icon]) => (
            <ButtonLink
              key={label}
              onClick={() => {
                fromChain &&
                  recommendedQuote &&
                  dispatch(
                    trackUnifiedSwapBridgeEvent(
                      UnifiedSwapBridgeEventName.AllQuotesSorted,
                      {
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        can_submit: !insufficientBal,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        sort_order: sortOrder,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        price_impact: Number(
                          recommendedQuote.quote?.priceData?.priceImpact ?? '0',
                        ),
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        gas_included: false,
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
                        stx_enabled: isStxEnabled,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        best_quote_provider: formatProviderLabel(
                          recommendedQuote.quote,
                        ),
                      },
                    ),
                  );
                quoteRequestProperties &&
                  requestMetadataProperties &&
                  quoteListProperties &&
                  trackCrossChainSwapsEvent({
                    event: MetaMetricsEventName.AllQuotesSorted,
                    properties: {
                      ...quoteRequestProperties,
                      ...requestMetadataProperties,
                      ...quoteListProperties,
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      sort_order: sortOrder,
                    },
                  });
                dispatch(setSortOrder(sortOrderOption));
              }}
              startIconName={
                sortOrder === sortOrderOption && sortOrder === SortOrder.ETA_ASC
                  ? icon
                  : undefined
              }
              startIconProps={{
                size: IconSize.Xs,
              }}
              endIconName={
                sortOrder === sortOrderOption &&
                sortOrder === SortOrder.COST_ASC
                  ? icon
                  : undefined
              }
              endIconProps={{
                size: IconSize.Xs,
              }}
              color={
                sortOrder === sortOrderOption
                  ? TextColor.primaryDefault
                  : TextColor.textAlternativeSoft
              }
            >
              <Text
                variant={
                  sortOrder === sortOrderOption
                    ? TextVariant.bodySmMedium
                    : TextVariant.bodySm
                }
                color={
                  sortOrder === sortOrderOption
                    ? TextColor.primaryDefault
                    : TextColor.textAlternativeSoft
                }
              >
                {label}
              </Text>
            </ButtonLink>
          ))}
        </Row>
        {/* QUOTE LIST */}
        <Column style={{ overflow: 'scroll' }}>
          {sortedQuotes.map(
            (quote: QuoteMetadata & QuoteResponse, index: number) => {
              const {
                totalNetworkFee,
                estimatedProcessingTimeInSeconds,
                toTokenAmount,
                cost,
                sentAmount,
                quote: { destAsset, bridges, requestId, gasIncluded },
              } = quote;
              const isQuoteActive = requestId === activeQuote?.quote.requestId;
              const isRecommendedQuote =
                requestId === recommendedQuote?.quote.requestId;

              return (
                <Row
                  alignItems={AlignItems.flexStart}
                  key={index}
                  backgroundColor={
                    isQuoteActive ? BackgroundColor.primaryMuted : undefined
                  }
                  onClick={() => {
                    quote &&
                      dispatch(
                        trackUnifiedSwapBridgeEvent(
                          UnifiedSwapBridgeEventName.QuoteSelected,
                          {
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            can_submit: !insufficientBal,
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            is_best_quote: isRecommendedQuote,
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            best_quote_provider: formatProviderLabel(
                              quote?.quote,
                            ),
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            usd_quoted_gas: Number(
                              quote.gasFee?.effective?.usd ?? 0,
                            ),
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            quoted_time_minutes:
                              quote.estimatedProcessingTimeInSeconds / 60,
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            usd_quoted_return: Number(quote.toTokenAmount.usd),
                            provider: formatProviderLabel(quote.quote),
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            price_impact: Number(
                              quote.quote?.priceData?.priceImpact ?? '0',
                            ),
                            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            gas_included: false,
                          },
                        ),
                      );
                    dispatch(setSelectedQuote(quote));
                    // Emit QuoteSelected event after dispatching setSelectedQuote
                    quoteRequestProperties &&
                      requestMetadataProperties &&
                      quoteListProperties &&
                      tradeProperties &&
                      trackCrossChainSwapsEvent({
                        event: MetaMetricsEventName.QuoteSelected,
                        properties: {
                          ...quoteRequestProperties,
                          ...requestMetadataProperties,
                          ...quoteListProperties,
                          ...tradeProperties,
                          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                          // eslint-disable-next-line @typescript-eslint/naming-convention
                          is_best_quote: isRecommendedQuote,
                        },
                      });
                    onClose();
                  }}
                  paddingInline={4}
                  paddingTop={3}
                  paddingBottom={3}
                  style={{ position: 'relative' }}
                >
                  {isQuoteActive && (
                    <Column
                      style={{
                        position: 'absolute',
                        left: 4,
                        top: 4,
                        height: 'calc(100% - 8px)',
                        width: 4,
                        borderRadius: 8,
                      }}
                      backgroundColor={BackgroundColor.primaryDefault}
                    />
                  )}
                  <Column>
                    <Text variant={TextVariant.bodyMd}>
                      {gasIncluded
                        ? formatCurrencyAmount(
                            new BigNumber(sentAmount.valueInCurrency ?? 0)
                              .minus(toTokenAmount.valueInCurrency ?? 0)
                              .toString(),
                            currency,
                            2,
                          )
                        : formatCurrencyAmount(
                            cost.valueInCurrency,
                            currency,
                            2,
                          )}
                    </Text>
                    {[
                      gasIncluded && sentAmount?.valueInCurrency
                        ? t('quotedTotalCost', [
                            formatCurrencyAmount(
                              sentAmount.valueInCurrency,
                              currency,
                              2,
                            ),
                          ])
                        : undefined,
                      !gasIncluded &&
                        (totalNetworkFee?.valueInCurrency &&
                        sentAmount?.valueInCurrency
                          ? t('quotedTotalCost', [
                              formatCurrencyAmount(
                                new BigNumber(totalNetworkFee.valueInCurrency)
                                  .plus(sentAmount.valueInCurrency)
                                  .toString(),
                                currency,
                                2,
                              ),
                            ])
                          : t('quotedTotalCost', [
                              formatTokenAmount(
                                locale,
                                totalNetworkFee.amount,
                                nativeCurrency,
                              ),
                            ])),
                      t('quotedReceiveAmount', [
                        formatCurrencyAmount(
                          toTokenAmount.valueInCurrency,
                          currency,
                          2,
                        ) ??
                          formatTokenAmount(
                            locale,
                            toTokenAmount.amount,
                            destAsset.symbol,
                          ),
                      ]),
                    ]
                      .filter(Boolean)
                      .map((content) => (
                        <Text
                          key={content}
                          variant={TextVariant.bodyXsMedium}
                          color={TextColor.textAlternative}
                        >
                          {content}
                        </Text>
                      ))}
                  </Column>
                  <Column alignItems={AlignItems.flexEnd}>
                    <Text variant={TextVariant.bodyMd}>
                      {t('bridgeTimingMinutes', [
                        formatEtaInMinutes(estimatedProcessingTimeInSeconds),
                      ])}
                    </Text>
                    <Text
                      variant={TextVariant.bodyXsMedium}
                      color={TextColor.textAlternative}
                    >
                      {startCase(bridges[0])}
                    </Text>
                  </Column>
                </Row>
              );
            },
          )}
        </Column>
      </ModalContent>
    </Modal>
  );
};
