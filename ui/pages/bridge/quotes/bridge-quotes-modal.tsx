import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startCase } from 'lodash';
import {
  type QuoteResponse,
  FeatureId,
  QuoteMetadata,
  UnifiedSwapBridgeEventName,
  formatProviderLabel,
  sumAmounts,
} from '@metamask/bridge-controller';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  Text,
} from '../../../components/component-library';
import { BRIDGE_DEBUG_ENABLED } from '../../../../shared/constants/bridge';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setSelectedQuote,
  trackUnifiedSwapBridgeEvent,
} from '../../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getQuoteRequest,
} from '../../../ducks/bridge/selectors';
import { Column, Row } from '../layout';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getMultichainNativeCurrency } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { insufficientBal } = useSelector(getQuoteRequest);

  const { sortedQuotes, activeQuote, recommendedQuote } =
    useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);
  const nativeCurrency = useMultichainSelector(getMultichainNativeCurrency);
  const locale = useSelector(getIntlLocale);

  const isRecommendedQuote = useCallback(
    (quote: QuoteResponse) => {
      return quote.quote.requestId === recommendedQuote?.quote.requestId;
    },
    [recommendedQuote],
  );

  const handleQuoteSelected = useCallback(
    (quote: QuoteResponse) => {
      const networkFee = sumAmounts(quote.quote.feeData.network);
      dispatch(setSelectedQuote(quote));
      recommendedQuote &&
        dispatch(
          trackUnifiedSwapBridgeEvent(
            UnifiedSwapBridgeEventName.QuoteSelected,
            {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              can_submit: !insufficientBal,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              is_best_quote: isRecommendedQuote(quote),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              best_quote_provider: formatProviderLabel(recommendedQuote.quote),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              usd_quoted_gas: Number(networkFee?.usd ?? 0),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              quoted_time_minutes: quote.estimatedProcessingTimeInSeconds / 60,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              usd_quoted_return: Number(quote.quote.dest.usd),
              provider: formatProviderLabel(quote.quote),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              price_impact: Number(
                quote.quote?.priceData?.priceImpact?.amount ?? '0',
              ),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_included: Boolean(quote.quote?.gasIncluded),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_included_7702: Boolean(quote.quote?.gasIncluded7702),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
            },
          ),
        );
      onClose();
    },
    [dispatch, isRecommendedQuote, insufficientBal, onClose, recommendedQuote],
  );

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
            {t('bridgeSelectQuote')}
          </Text>
        </ModalHeader>

        {/* HEADER */}
        <Row padding={4} paddingTop={0}>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {t('bridgeQuotesSortedByCost')}
          </Text>
        </Row>
        {/* QUOTE LIST */}
        <Column maxWidth={BlockSize.Full} style={{ overflow: 'auto' }}>
          {sortedQuotes.map(
            (quote: QuoteResponse & QuoteMetadata, index: number) => {
              const {
                toTokenAmount,
                quote: { dest, protocols, requestId },
              } = quote;
              const isQuoteActive = requestId === activeQuote?.quote.requestId;
              const isRecommended = isRecommendedQuote(quote);

              return (
                <Column
                  className={`bridge-quote-option${isQuoteActive ? ' bridge-quote-option--selected' : ''}`}
                  alignItems={AlignItems.flexStart}
                  key={index}
                  backgroundColor={
                    isQuoteActive ? BackgroundColor.primaryMuted : undefined
                  }
                  onClick={() => handleQuoteSelected(quote)}
                  paddingInline={4}
                  paddingTop={3}
                  paddingBottom={3}
                  style={{ position: 'relative', cursor: 'pointer' }}
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

                  <Row maxWidth={BlockSize.Full} width={BlockSize.Full} gap={2}>
                    {/* PROVIDER NAME */}
                    <Text
                      variant={TextVariant.bodyMd}
                      fontWeight={FontWeight.Medium}
                      ellipsis={true}
                      style={{
                        whiteSpace: 'nowrap',
                        flexShrink: 1,
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {startCase(protocols[0])}
                    </Text>
                    {/* DEST AMOUNT */}
                    <Text
                      variant={TextVariant.bodyMd}
                      fontWeight={FontWeight.Medium}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {formatTokenAmount(
                        locale,
                        dest.normalizedAmount ?? '0',
                        dest.asset.symbol,
                      )}
                      {BRIDGE_DEBUG_ENABLED
                        ? ` (${toTokenAmount?.amount ?? '0'})`
                        : ''}
                    </Text>
                  </Row>

                  <Row
                    alignItems={AlignItems.stretch}
                    gap={2}
                    width={BlockSize.Full}
                  >
                    {/* TOTAL COST + TAG */}
                    <Row gap={1}>
                      <Text
                        variant={TextVariant.bodySm}
                        color={TextColor.textAlternative}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {t('quotedTotalCost', [
                          !quote.quote.priceData?.priceImpact
                            ?.valueInCurrency &&
                          sumAmounts(
                            quote.quote.feeData.network,
                            quote.quote.feeData.relayer,
                          )?.normalizedAmount
                            ? formatTokenAmount(
                                locale,
                                sumAmounts(
                                  quote.quote.feeData.network,
                                  quote.quote.feeData.relayer,
                                )?.normalizedAmount,
                                nativeCurrency,
                              ) +
                              (BRIDGE_DEBUG_ENABLED
                                ? ` (${quote.totalNetworkFee?.amount?.slice(0, 10) ?? '0'})`
                                : '')
                            : formatCurrencyAmount(
                                quote.quote.priceData?.priceImpact
                                  ?.valueInCurrency ?? '0',
                                currency,
                                2,
                              ) +
                              (BRIDGE_DEBUG_ENABLED
                                ? ` (${quote.cost?.valueInCurrency?.slice(0, 6) ?? '0'})`
                                : ''),
                        ])}
                      </Text>
                      {isRecommended && (
                        <Tag
                          backgroundColor={BackgroundColor.successMuted}
                          labelProps={{
                            color: TextColor.successDefault,
                            fontWeight: FontWeight.Medium,
                          }}
                          style={{
                            whiteSpace: 'nowrap',
                            paddingInline: 6,
                            paddingTop: 0,
                            paddingBottom: 0,
                          }}
                          label={t('bridgeLowestCost')}
                        />
                      )}
                    </Row>
                    {/* RECEIVED AMOUNT */}
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {(formatCurrencyAmount(
                        quote.quote.dest.valueInCurrency,
                        currency,
                        2,
                      ) ?? '') +
                        (BRIDGE_DEBUG_ENABLED
                          ? ` (${quote.toTokenAmount?.valueInCurrency?.slice(0, 10) ?? '0'})`
                          : '')}
                    </Text>
                  </Row>
                </Column>
              );
            },
          )}
        </Column>
      </ModalContent>
    </Modal>
  );
};
