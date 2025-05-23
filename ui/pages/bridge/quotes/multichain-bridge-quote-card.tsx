import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  isSolanaChainId,
  BRIDGE_MM_FEE_RATE,
  formatChainIdToHex,
  formatEtaInMinutes,
  UnifiedSwapBridgeEventName,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import type { ChainId } from '@metamask/bridge-controller';
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
  getIsBridgeTx,
  getToToken,
  getFromToken,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
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
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import {
  MULTICHAIN_TOKEN_IMAGE_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { trackUnifiedSwapBridgeEvent } from '../../../ducks/bridge/actions';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getSmartTransactionsEnabled } from '../../../../shared/modules/selectors';
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
  const isBridgeTx = useSelector(getIsBridgeTx);
  const isStxEnabled = useSelector(getSmartTransactionsEnabled);
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const dispatch = useDispatch();

  const [showAllQuotes, setShowAllQuotes] = useState(false);

  const getNetworkImage = (chainId: ChainId) => {
    if (isSolanaChainId(chainId)) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.SOLANA];
    }
    return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      formatChainIdToHex(
        chainId,
      ) as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];
  };

  const getNetworkName = (chainId: ChainId) => {
    if (isSolanaChainId(chainId)) {
      return NETWORK_TO_SHORT_NETWORK_NAME_MAP[MultichainNetworks.SOLANA];
    }
    return NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      formatChainIdToHex(
        chainId,
      ) as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
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
                  activeQuote.swapRate,
                )} ${activeQuote.quote.destAsset.symbol}`}
              </Text>
            </Row>

            {/* Bridging - Only show when it's a bridge transaction */}
            {isBridgeTx && (
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
            )}

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
                  activeQuote.totalMaxNetworkFee?.valueInCurrency,
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
                  fromChain?.chainId &&
                    activeQuote &&
                    dispatch(
                      trackUnifiedSwapBridgeEvent(
                        UnifiedSwapBridgeEventName.AllQuotesOpened,
                        {
                          stx_enabled: isStxEnabled,
                          token_symbol_source:
                            fromToken?.symbol ??
                            getNativeAssetForChainId(fromChain.chainId).symbol,
                          token_symbol_destination: toToken?.symbol ?? null,
                          price_impact: Number(
                            activeQuote.quote?.priceData?.priceImpact ?? '0',
                          ),
                          gas_included: false,
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
        </Column>
      ) : null}
    </>
  );
};
