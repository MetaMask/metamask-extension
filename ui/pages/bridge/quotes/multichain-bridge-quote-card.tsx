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
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  formatCurrencyAmount,
  formatTokenAmount,
  formatEtaInMinutes,
} from '../utils/quote';
import {
  getCurrentCurrency,
  getNativeCurrency,
} from '../../../ducks/metamask/metamask';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useQuoteProperties } from '../../../hooks/bridge/events/useQuoteProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  IconColor,
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
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { TERMS_OF_USE_LINK } from '../../../../shared/constants/terms';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { BridgeQuotesModal } from './bridge-quotes-modal';
import { shortenString } from '../../../helpers/utils/util';

interface MultichainBridgeQuoteCardProps {
  destinationAddress?: string;
}

export const MultichainBridgeQuoteCard = ({
  destinationAddress,
}: MultichainBridgeQuoteCardProps) => {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);
  const ticker = useSelector(getNativeCurrency);
  const { isEstimatedReturnLow } = useSelector(getValidationErrors);

  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const quoteListProperties = useQuoteProperties();

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const locale = useSelector(getIntlLocale);

  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [shouldShowNetworkFeesInGasToken, setShouldShowNetworkFeesInGasToken] =
    useState(false);

  return (
    <>
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      {activeQuote ? (
        <Column gap={3}>
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row
              gap={1}
              justifyContent={JustifyContent.flexStart}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Text variant={TextVariant.bodyLgMedium}>{t('bestPrice')}</Text>
              <Tooltip
                title={t('howQuotesWork')}
                position={PopoverPosition.TopStart}
                offset={[-16, 16]}
                iconName={IconName.Question}
              >
                {t('howQuotesWorkExplanation', [BRIDGE_MM_FEE_RATE])}
              </Tooltip>
            </Row>
            <Column height={BlockSize.Full} alignItems={AlignItems.flexEnd}>
              <Text
                as={'a'}
                variant={TextVariant.bodyMd}
                color={TextColor.primaryDefault}
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
              </Text>
            </Column>
          </Row>
          <Column gap={1}>
            <Row justifyContent={JustifyContent.flexStart} gap={1}>
              <Row gap={1}>
                <AvatarNetwork
                  name={fromChain?.name ?? ''}
                  src={
                    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                      `0x${decimalToHex(
                        activeQuote.quote.srcChainId,
                      )}` as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                    ]
                  }
                  size={AvatarNetworkSize.Xs}
                  backgroundColor={BackgroundColor.transparent}
                />
                <Text style={{ whiteSpace: 'nowrap' }}>
                  {
                    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                      `0x${decimalToHex(
                        activeQuote.quote.srcChainId,
                      )}` as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                    ]
                  }
                </Text>
                <Icon name={IconName.Arrow2Right} size={IconSize.Xs} />
                <AvatarNetwork
                  name={toChain?.name ?? ''}
                  src={
                    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                      `0x${decimalToHex(
                        activeQuote.quote.destChainId,
                      )}` as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                    ]
                  }
                  size={AvatarNetworkSize.Xs}
                  backgroundColor={BackgroundColor.transparent}
                />
                <Text style={{ whiteSpace: 'nowrap' }}>
                  {
                    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                      `0x${decimalToHex(
                        activeQuote.quote.destChainId,
                      )}` as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                    ]
                  }
                </Text>
              </Row>
              {destinationAddress && (
                <Text
                  style={{ whiteSpace: 'nowrap' }}
                  color={TextColor.textAlternative}
                >
                  {shortenString(destinationAddress)}
                </Text>
              )}
            </Row>

            <Row gap={2} style={{ display: 'flex', justifyContent: 'start' }}>
              <Row
                className="row-with-warning"
                backgroundColor={
                  isEstimatedReturnLow
                    ? BackgroundColor.warningMuted
                    : undefined
                }
                gap={1}
                style={{
                  width: 'auto',
                }}
              >
                <Icon
                  name={IconName.Gas}
                  size={IconSize.Sm}
                  color={
                    isEstimatedReturnLow
                      ? IconColor.warningDefault
                      : IconColor.iconAlternative
                  }
                />
                <Text
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                  }}
                  color={
                    isEstimatedReturnLow ? TextColor.warningDefault : undefined
                  }
                >
                  {shouldShowNetworkFeesInGasToken
                    ? `${
                        activeQuote.totalNetworkFee?.valueInCurrency
                          ? formatTokenAmount(
                              locale,
                              activeQuote.totalNetworkFee?.amount,
                            )
                          : undefined
                      } - ${
                        activeQuote.totalMaxNetworkFee?.valueInCurrency
                          ? formatTokenAmount(
                              locale,
                              activeQuote.totalMaxNetworkFee?.amount,
                              ticker,
                            )
                          : undefined
                      }`
                    : `${
                        formatCurrencyAmount(
                          activeQuote.totalNetworkFee?.valueInCurrency,
                          currency,
                          2,
                        ) ??
                        formatTokenAmount(
                          locale,
                          activeQuote.totalNetworkFee?.amount,
                        )
                      } - ${
                        formatCurrencyAmount(
                          activeQuote.totalMaxNetworkFee?.valueInCurrency,
                          currency,
                          2,
                        ) ??
                        formatTokenAmount(
                          locale,
                          activeQuote.totalMaxNetworkFee?.amount,
                          ticker,
                        )
                      }`}
                </Text>
                <Icon
                  style={{ cursor: 'pointer' }}
                  color={
                    isEstimatedReturnLow
                      ? IconColor.warningDefault
                      : IconColor.iconAlternativeSoft
                  }
                  name={IconName.SwapVertical}
                  size={IconSize.Md}
                  onClick={() =>
                    setShouldShowNetworkFeesInGasToken(
                      !shouldShowNetworkFeesInGasToken,
                    )
                  }
                />
              </Row>

              <Row gap={1}>
                <Icon
                  name={IconName.Clock}
                  size={IconSize.Sm}
                  color={IconColor.iconAlternative}
                />
                <Text>
                  {t('bridgeTimingMinutes', [
                    formatEtaInMinutes(
                      activeQuote.estimatedProcessingTimeInSeconds,
                    ),
                  ])}
                </Text>
              </Row>
            </Row>

            <Row justifyContent={JustifyContent.flexStart} gap={2}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternativeSoft}
              >
                {t('rateIncludesMMFee', [BRIDGE_MM_FEE_RATE])}
              </Text>
              <ButtonLink
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternativeSoft}
                href={TERMS_OF_USE_LINK}
                externalLink
                style={{ textDecoration: 'underline' }}
              >
                {t('bridgeTerms')}
              </ButtonLink>
            </Row>
          </Column>
        </Column>
      ) : null}
    </>
  );
};
