import React from 'react';
import { IconName } from '@metamask/snaps-sdk/jsx';
import { useDispatch, useSelector } from 'react-redux';
import { startCase } from 'lodash';
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
import {
  formatEtaInMinutes,
  formatFiatAmount,
  formatTokenAmount,
} from '../utils/quote';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../selectors';
import { setSelectedQuote, setSortOrder } from '../../../ducks/bridge/actions';
import { SortOrder } from '../types';
import {
  getBridgeQuotes,
  getBridgeSortOrder,
} from '../../../ducks/bridge/selectors';
import { Column, Row } from '../layout';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { useQuoteProperties } from '../../../hooks/bridge/events/useQuoteProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { sortedQuotes, activeQuote } = useSelector(getBridgeQuotes);
  const sortOrder = useSelector(getBridgeSortOrder);
  const currency = useSelector(getCurrentCurrency);
  const nativeCurrency = useSelector(getNativeCurrency);

  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const quoteListProperties = useQuoteProperties();

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
        <Row padding={[4, 3]} paddingBottom={1}>
          {[
            [SortOrder.COST_ASC, t('bridgeNetCost'), IconName.Arrow2Up],
            [SortOrder.ETA_ASC, t('time'), IconName.Arrow2Down],
          ].map(([sortOrderOption, label, icon]) => (
            <ButtonLink
              key={label}
              onClick={() => {
                quoteRequestProperties &&
                  requestMetadataProperties &&
                  quoteListProperties &&
                  trackCrossChainSwapsEvent({
                    event: MetaMetricsEventName.AllQuotesSorted,
                    properties: {
                      ...quoteRequestProperties,
                      ...requestMetadataProperties,
                      ...quoteListProperties,
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
                  : TextColor.textAlternative
              }
            >
              <Text
                variant={TextVariant.bodySm}
                color={
                  sortOrder === sortOrderOption
                    ? TextColor.primaryDefault
                    : TextColor.textAlternative
                }
              >
                {label}
              </Text>
            </ButtonLink>
          ))}
        </Row>
        {/* QUOTE LIST */}
        <Column style={{ overflow: 'scroll' }}>
          {sortedQuotes.map((quote, index) => {
            const {
              totalNetworkFee,
              estimatedProcessingTimeInSeconds,
              toTokenAmount,
              cost,
              quote: { destAsset, bridges, requestId },
            } = quote;
            const isQuoteActive = requestId === activeQuote?.quote.requestId;

            return (
              <Row
                alignItems={AlignItems.flexStart}
                key={index}
                backgroundColor={
                  isQuoteActive ? BackgroundColor.primaryMuted : undefined
                }
                onClick={() => {
                  dispatch(setSelectedQuote(quote));
                  onClose();
                }}
                paddingInline={4}
                paddingTop={3}
                paddingBottom={3}
                style={{ position: 'relative', height: 78 }}
              >
                {isQuoteActive && (
                  <Column
                    style={{
                      position: 'absolute',
                      left: 4,
                      top: 4,
                      height: 70,
                      width: 4,
                      borderRadius: 8,
                    }}
                    backgroundColor={BackgroundColor.primaryDefault}
                  />
                )}
                <Column>
                  <Text variant={TextVariant.bodyMd}>
                    {cost.fiat && formatFiatAmount(cost.fiat, currency, 0)}
                  </Text>
                  {[
                    totalNetworkFee?.fiat
                      ? t('quotedNetworkFee', [
                          formatFiatAmount(totalNetworkFee.fiat, currency, 0),
                        ])
                      : t('quotedNetworkFee', [
                          formatTokenAmount(
                            totalNetworkFee.amount,
                            nativeCurrency,
                          ),
                        ]),
                    t(
                      sortOrder === SortOrder.ETA_ASC
                        ? 'quotedReceivingAmount'
                        : 'quotedReceiveAmount',
                      [
                        formatFiatAmount(toTokenAmount.fiat, currency, 0) ??
                          formatTokenAmount(
                            toTokenAmount.amount,
                            destAsset.symbol,
                            0,
                          ),
                      ],
                    ),
                  ]
                    [sortOrder === SortOrder.ETA_ASC ? 'reverse' : 'slice']()
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
          })}
        </Column>
      </ModalContent>
    </Modal>
  );
};
