import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BRIDGE_MM_FEE_RATE,
  formatEtaInMinutes,
  getNativeAssetForChainId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import {
  Text,
  PopoverPosition,
  IconName,
  ButtonLink,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconSize,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromChain,
  getFromToken,
  getToChain,
  getToToken,
  getValidationErrors,
  getSlippage,
  getIsSolanaSwap,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
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
import { trackUnifiedSwapBridgeEvent } from '../../../ducks/bridge/actions';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { BridgeQuotesModal } from './bridge-quotes-modal';

export const BridgeQuoteCard = ({
  onOpenSlippageModal,
}: {
  onOpenSlippageModal?: () => void;
}) => {
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
  const slippage = useSelector(getSlippage);
  const isSolanaSwap = useSelector(getIsSolanaSwap);

  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [shouldShowNetworkFeesInGasToken, setShouldShowNetworkFeesInGasToken] =
    useState(false);

  const dispatch = useDispatch();
  const isStxEnabled = useSelector((state) =>
    getIsSmartTransaction(state as never, fromChain?.chainId),
  );
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
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
                  fromChain?.chainId &&
                    activeQuote &&
                    dispatch(
                      trackUnifiedSwapBridgeEvent(
                        UnifiedSwapBridgeEventName.AllQuotesOpened,
                        {
                          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                          // eslint-disable-next-line @typescript-eslint/naming-convention
                          stx_enabled: isStxEnabled,
                          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                          // eslint-disable-next-line @typescript-eslint/naming-convention
                          token_symbol_source:
                            fromToken?.symbol ??
                            getNativeAssetForChainId(fromChain.chainId).assetId,
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
                          gas_included: false,
                        },
                      ),
                    );
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
                      data-testid="network-fees"
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

            <Row justifyContent={JustifyContent.spaceBetween}>
              <Row gap={1} alignItems={AlignItems.center}>
                <Text
                  style={{ whiteSpace: 'nowrap' }}
                  variant={TextVariant.bodyMdMedium}
                  color={TextColor.textAlternativeSoft}
                >
                  {t('slippage')}
                </Text>
                <ButtonIcon
                  iconName={IconName.Edit}
                  size={ButtonIconSize.Sm}
                  color={IconColor.iconAlternativeSoft}
                  onClick={onOpenSlippageModal}
                  ariaLabel={t('slippageEditAriaLabel')}
                  data-testid="slippage-edit-button"
                />
              </Row>
              <Text variant={TextVariant.bodyMd}>
                {slippage === undefined && isSolanaSwap
                  ? t('slippageAuto')
                  : `${slippage}%`}
              </Text>
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
