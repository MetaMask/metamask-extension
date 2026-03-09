import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startCase } from 'lodash';
import {
  type QuoteMetadata,
  type QuoteResponse,
  UnifiedSwapBridgeEventName,
  formatProviderLabel,
} from '@metamask/bridge-controller';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  Text,
} from '../../../components/component-library';
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
    (quote: QuoteMetadata & QuoteResponse) => {
      return quote.quote.requestId === recommendedQuote?.quote.requestId;
    },
    [recommendedQuote],
  );

  const handleQuoteSelected = useCallback(
    (quote: QuoteMetadata & QuoteResponse) => {
      dispatch(setSelectedQuote(quote));
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.QuoteSelected, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          can_submit: !insufficientBal,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_best_quote: isRecommendedQuote(quote),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          best_quote_provider: formatProviderLabel(quote?.quote),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_quoted_gas: Number(quote.gasFee?.effective?.usd ?? 0),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          quoted_time_minutes: quote.estimatedProcessingTimeInSeconds / 60,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_quoted_return: Number(quote.toTokenAmount.usd),
          provider: formatProviderLabel(quote.quote),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          price_impact: Number(quote.quote?.priceData?.priceImpact ?? '0'),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          gas_included: Boolean(quote.quote?.gasIncluded),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          gas_included_7702: Boolean(quote.quote?.gasIncluded7702),
        }),
      );
      onClose();
    },
    [dispatch, isRecommendedQuote, insufficientBal, onClose],
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
        <Column maxWidth={BlockSize.Full} style={{ overflow: 'scroll' }}>
          {sortedQuotes.map(
            (quote: QuoteMetadata & QuoteResponse, index: number) => {
              const {
                totalNetworkFee,
                toTokenAmount,
                cost,
                quote: { destAsset, bridges, requestId },
              } = quote;
              const isQuoteActive = requestId === activeQuote?.quote.requestId;
              const isRecommended = isRecommendedQuote(quote);

              return (
                <Column
                  alignItems={AlignItems.flexStart}
                  key={index}
                  backgroundColor={
                    isQuoteActive ? BackgroundColor.primaryMuted : undefined
                  }
                  onClick={() => handleQuoteSelected(quote)}
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
                      {startCase(bridges[0])}
                    </Text>
                    {/* DEST AMOUNT */}
                    <Text
                      variant={TextVariant.bodyMd}
                      fontWeight={FontWeight.Medium}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {formatTokenAmount(
                        locale,
                        toTokenAmount.amount,
                        destAsset.symbol,
                      )}
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
                          cost?.valueInCurrency
                            ? formatCurrencyAmount(
                                cost.valueInCurrency,
                                currency,
                                2,
                              )
                            : formatTokenAmount(
                                locale,
                                totalNetworkFee.amount,
                                nativeCurrency,
                              ),
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
                      {formatCurrencyAmount(
                        toTokenAmount.valueInCurrency,
                        currency,
                        2,
                      ) ?? ''}
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
