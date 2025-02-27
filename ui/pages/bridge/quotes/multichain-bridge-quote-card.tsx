import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Text,
  PopoverPosition,
  IconName,
  ButtonLink,
  Icon,
  IconSize,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromChain,
  getToChain,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  formatCurrencyAmount,
  formatTokenAmount,
  formatEtaInMinutes,
} from '../utils/quote';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useQuoteProperties } from '../../../hooks/bridge/events/useQuoteProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  BackgroundColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Row, Column, Tooltip } from '../layout';
import {
  BRIDGE_MM_FEE_RATE,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../shared/constants/bridge';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import {
  MULTICHAIN_TOKEN_IMAGE_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { getIntlLocale } from '../../../ducks/locale/locale';
import type { ChainId } from '../../../../shared/types/bridge';
import { BridgeQuotesModal } from './bridge-quotes-modal';

export const MultichainBridgeQuoteCard = () => {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);

  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const quoteListProperties = useQuoteProperties();

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const locale = useSelector(getIntlLocale);

  const [showAllQuotes, setShowAllQuotes] = useState(false);

  const getNetworkImage = (chainId: ChainId) => {
    if (chainId === 1151111081099710) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.SOLANA];
    }
    return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      `0x${decimalToHex(
        chainId,
      )}` as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];
  };

  const getNetworkName = (chainId: ChainId) => {
    if (chainId === 1151111081099710) {
      return 'Solana';
    }
    return NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      `0x${decimalToHex(
        chainId,
      )}` as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
    ];
  };

  return (
    <>
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      {activeQuote ? (
        <Column gap={3}>
          <Column gap={2}>
            {/* Quote */}
            <Row justifyContent={JustifyContent.spaceBetween}>
              <Row gap={1}>
                <Text
                  variant={TextVariant.bodyMd}
                  color={TextColor.textAlternative}
                >
                  {t('multichainQuoteCardQuoteLabel')}
                </Text>
                <Tooltip
                  title={t('howQuotesWork')}
                  position={PopoverPosition.TopStart}
                  offset={[-16, 16]}
                  iconName={IconName.Question}
                >
                  {t('howQuotesWorkExplanation', [BRIDGE_MM_FEE_RATE])}
                </Tooltip>
              </Row>
              <Text>
                {`1 ${activeQuote.quote.srcAsset.symbol} = ${formatTokenAmount(
                  locale,
                  activeQuote.toTokenAmount.amount.dividedBy(
                    activeQuote.sentAmount.amount,
                  ),
                )} ${activeQuote.quote.destAsset.symbol}`}
              </Text>
            </Row>

            {/* Bridging */}
            <Row justifyContent={JustifyContent.spaceBetween}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
              >
                {t('multichainQuoteCardBridgingLabel')}
              </Text>
              <Row gap={1}>
                <AvatarNetwork
                  name={fromChain?.name ?? ''}
                  src={getNetworkImage(activeQuote.quote.srcChainId)}
                  size={AvatarNetworkSize.Xs}
                  backgroundColor={BackgroundColor.transparent}
                />
                <Text>{getNetworkName(activeQuote.quote.srcChainId)}</Text>
                <Icon name={IconName.Arrow2Right} size={IconSize.Xs} />
                <AvatarNetwork
                  name={toChain?.name ?? ''}
                  src={getNetworkImage(activeQuote.quote.destChainId)}
                  size={AvatarNetworkSize.Xs}
                  backgroundColor={BackgroundColor.transparent}
                />
                <Text>{getNetworkName(activeQuote.quote.destChainId)}</Text>
              </Row>
            </Row>

            {/* Network Fee */}
            <Row justifyContent={JustifyContent.spaceBetween}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
              >
                {t('networkFee')}
              </Text>
              <Text>
                {formatCurrencyAmount(
                  activeQuote.totalNetworkFee?.valueInCurrency,
                  currency,
                  2,
                )}
              </Text>
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

            {/* Footer */}
            <Row
              justifyContent={JustifyContent.spaceBetween}
              color={TextColor.textAlternative}
            >
              <Text variant={TextVariant.bodyMd}>
                {t('rateIncludesMMFee', [BRIDGE_MM_FEE_RATE])}
              </Text>
              <ButtonLink
                variant={TextVariant.bodyMd}
                onClick={() => {
                  quoteRequestProperties &&
                    requestMetadataProperties &&
                    quoteListProperties &&
                    trackCrossChainSwapsEvent({
                      event: MetaMetricsEventName.AllQuotesOpened,
                      properties: {
                        ...quoteRequestProperties,
                        ...requestMetadataProperties,
                        ...quoteListProperties,
                      },
                    });
                  setShowAllQuotes(true);
                }}
              >
                {t('moreQuotes')}
              </ButtonLink>
            </Row>
          </Column>
        </Column>
      ) : null}
    </>
  );
};
