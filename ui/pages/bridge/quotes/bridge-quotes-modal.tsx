import React, { useState } from 'react';
import { IconName } from '@metamask/snaps-sdk/jsx';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Icon,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../components/component-library';
import {
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  formatEtaInMinutes,
  formatFiatAmount,
  formatTokenAmount,
} from '../utils/quote';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../selectors';
import { setSortOrder } from '../../../ducks/bridge/actions';
import { SortOrder, QuoteMetadata, QuoteResponse } from '../types';
import { Footer } from '../../../components/multichain/pages/page';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import {
  getBridgeQuotes,
  getBridgeSortOrder,
} from '../../../ducks/bridge/selectors';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { sortedQuotes, activeQuote, recommendedQuote } =
    useSelector(getBridgeQuotes);
  const sortOrder = useSelector(getBridgeSortOrder);
  const currency = useSelector(getCurrentCurrency);
  const { isLoading } = useSelector(getBridgeQuotes);

  const secondsUntilNextRefresh = useCountdownTimer();

  const [expandedQuote, setExpandedQuote] = useState<
    (QuoteResponse & QuoteMetadata) | undefined
  >(undefined);

  return (
    <Modal className="quotes-modal" onClose={onClose} {...modalProps}>
      <ModalOverlay />

      {expandedQuote ? (
        <ModalContent modalDialogProps={{ padding: 0 }}>
          <ModalHeader onBack={() => setExpandedQuote(undefined)}>
            <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
              {t('swapQuoteDetails')}
            </Text>
          </ModalHeader>
          <Box className="quotes-modal__quote-details">
            <Text>{JSON.stringify(expandedQuote)}</Text>
          </Box>
          <Footer>
            <Button
              data-testid="quotes-modal-use-quote-button"
              onClick={() => {
                // TODO select quote
                onClose();
              }}
              disabled={false}
            >
              {t('bridgeUseQuote')}
            </Button>
          </Footer>
        </ModalContent>
      ) : (
        <ModalContent
          className="quotes-modal__container"
          modalDialogProps={{ padding: 0 }}
        >
          <ModalHeader onClose={onClose}>
            <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
              {t('swapSelectAQuote')}
            </Text>
          </ModalHeader>

          {/* HEADERS */}
          <Box className="quotes-modal__column-header">
            <span
              onClick={() =>
                dispatch(setSortOrder(SortOrder.ADJUSTED_RETURN_DESC))
              }
              className={
                sortOrder === SortOrder.ADJUSTED_RETURN_DESC
                  ? 'active-sort'
                  : ''
              }
            >
              <Icon name={IconName.ArrowDown} size={IconSize.Xs} />
              <Text>{t('bridgeOverallCost')}</Text>
            </span>
            <span
              onClick={() => dispatch(setSortOrder(SortOrder.ETA_ASC))}
              className={sortOrder === SortOrder.ETA_ASC ? 'active-sort' : ''}
            >
              <Icon name={IconName.ArrowDown} size={IconSize.Xs} />
              <Text>{t('time')}</Text>
            </span>
          </Box>
          {/* QUOTE LIST */}
          <Box className="quotes-modal__quotes">
            {sortedQuotes.map((quote, index) => {
              const {
                totalNetworkFee,
                estimatedProcessingTimeInSeconds,
                toTokenAmount,
                cost,
                quote: { destAsset, bridges, requestId },
              } = quote;
              const isQuoteActive = requestId === activeQuote?.quote.requestId;
              const isQuoteRecommended =
                requestId === recommendedQuote?.quote.requestId;

              return (
                <Box
                  key={index}
                  className={`quotes-modal__quotes__row ${
                    isQuoteActive ? 'active-quote' : ''
                  }`}
                  onClick={() => setExpandedQuote(quote)}
                >
                  {isQuoteActive && (
                    <span className="quotes-modal__quotes__row-bar" />
                  )}
                  <span className="quotes-modal__quotes__row-left">
                    {cost.fiat && (
                      <span>
                        {isQuoteRecommended && (
                          <Text className="description">
                            {t(
                              sortOrder === SortOrder.ADJUSTED_RETURN_DESC
                                ? 'bridgeLowest'
                                : 'bridgeFastest',
                            )}
                          </Text>
                        )}
                        <Text>{formatFiatAmount(cost.fiat, currency)}</Text>
                      </span>
                    )}
                    <span>
                      <Text>
                        {formatFiatAmount(toTokenAmount.fiat, currency) ??
                          formatTokenAmount(
                            toTokenAmount.raw,
                            destAsset.symbol,
                          )}
                      </Text>
                      <span>
                        <Icon name={IconName.Gas} size={IconSize.Xs} />
                        <Text>
                          {formatFiatAmount(totalNetworkFee?.fiat, currency)}
                        </Text>
                      </span>
                    </span>
                  </span>
                  <span className="quotes-modal__quotes__row-right">
                    <Text>{bridges[0]}</Text>
                    <Text>
                      {t('bridgeTimingMinutes', [
                        formatEtaInMinutes(estimatedProcessingTimeInSeconds),
                      ])}
                    </Text>
                    <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
                  </span>
                </Box>
              );
            })}
          </Box>
          <Box className="quotes-modal__timer">
            {!isLoading && (
              <Text>{t('swapNewQuoteIn', [secondsUntilNextRefresh])}</Text>
            )}
          </Box>
        </ModalContent>
      )}
    </Modal>
  );
};
