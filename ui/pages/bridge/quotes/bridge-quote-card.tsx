import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { BRIDGE_MM_FEE_RATE } from '@metamask/bridge-controller';
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
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { TERMS_OF_USE_LINK } from '../../../../shared/constants/terms';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getImageForChainId } from '../../../selectors/multichain';
import { BridgeQuotesModal } from './bridge-quotes-modal';

export const BridgeQuoteCard = () => {
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
                as="a"
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
            <Row>
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textAlternativeSoft}
              >
                {t('bridging')}
              </Text>
              <Row gap={1}>
                <AvatarNetwork
                  name={fromChain?.name ?? ''}
                  src={
                    fromChain?.chainId
                      ? getImageForChainId(fromChain.chainId)
                      : undefined
                  }
                  size={AvatarNetworkSize.Xs}
                  backgroundColor={BackgroundColor.transparent}
                />
                <Text style={{ whiteSpace: 'nowrap' }}>
                  {fromChain?.chainId
                    ? NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                        fromChain.chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                      ]
                    : fromChain?.name}
                </Text>
                <Icon name={IconName.Arrow2Right} size={IconSize.Xs} />
                <AvatarNetwork
                  name={toChain?.name ?? ''}
                  src={
                    toChain?.chainId
                      ? getImageForChainId(toChain.chainId)
                      : undefined
                  }
                  size={AvatarNetworkSize.Xs}
                  backgroundColor={BackgroundColor.transparent}
                />
                <Text style={{ whiteSpace: 'nowrap' }}>
                  {toChain?.chainId
                    ? NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                        toChain.chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                      ]
                    : toChain?.name}
                </Text>
              </Row>
            </Row>

            <Row
              className="row-with-warning"
              backgroundColor={
                isEstimatedReturnLow ? BackgroundColor.warningMuted : undefined
              }
            >
              <Text
                style={{ whiteSpace: 'nowrap' }}
                variant={TextVariant.bodyMdMedium}
                color={
                  isEstimatedReturnLow
                    ? TextColor.warningDefault
                    : TextColor.textAlternativeSoft
                }
              >
                {t('networkFee')}
              </Text>
              <Row gap={1}>
                <Tooltip
                  position={PopoverPosition.TopStart}
                  offset={[-16, 16]}
                  iconName={IconName.Question}
                  triggerElement={
                    <Text
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                      color={
                        isEstimatedReturnLow
                          ? TextColor.warningDefault
                          : undefined
                      }
                    >
                      {shouldShowNetworkFeesInGasToken
                        ? //  Network fee in gas token amounts
                          `${
                            activeQuote?.totalNetworkFee?.valueInCurrency
                              ? formatTokenAmount(
                                  locale,
                                  activeQuote?.totalNetworkFee?.amount,
                                  ticker,
                                )
                              : undefined
                          }`
                        : // Network fee in display currency
                          `${
                            formatCurrencyAmount(
                              activeQuote?.totalNetworkFee?.valueInCurrency,
                              currency,
                              2,
                            ) ??
                            formatTokenAmount(
                              locale,
                              activeQuote?.totalNetworkFee?.amount,
                              ticker,
                            )
                          }`}
                    </Text>
                  }
                >
                  {t('howNetworkFeesWorkExplanation', [
                    shouldShowNetworkFeesInGasToken
                      ? formatTokenAmount(
                          locale,
                          activeQuote?.totalMaxNetworkFee.amount,
                          ticker,
                        )
                      : formatCurrencyAmount(
                          activeQuote?.totalMaxNetworkFee.valueInCurrency,
                          currency,
                          2,
                        ),
                  ])}
                </Tooltip>

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
            </Row>

            <Row>
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textAlternativeSoft}
              >
                {t('time')}
              </Text>
              <Text>
                {t('bridgeTimingMinutes', [
                  formatEtaInMinutes(
                    activeQuote.estimatedProcessingTimeInSeconds,
                  ),
                ])}
              </Text>
            </Row>
            <Row justifyContent={JustifyContent.flexStart} gap={2}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternativeSoft}
              >
                {t('rateIncludesMMFee', [BRIDGE_MM_FEE_RATE])}
              </Text>
              <Text color={TextColor.textAlternativeSoft}>
                {t('bulletpoint')}
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
