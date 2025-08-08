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
  getToChain,
  getIsBridgeTx,
  getToToken,
  getFromToken,
  getSlippage,
  getIsSolanaSwap,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  BackgroundColor,
  FontStyle,
  IconColor,
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
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { BridgeQuotesModal } from './bridge-quotes-modal';

export const MultichainBridgeQuoteCard = ({
  onOpenSlippageModal,
}: {
  onOpenSlippageModal?: () => void;
}) => {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const locale = useSelector(getIntlLocale);
  const isBridgeTx = useSelector(getIsBridgeTx);
  const isStxEnabled = useSelector((state) =>
    getIsSmartTransaction(state as never, fromChain?.chainId),
  );
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const slippage = useSelector(getSlippage);
  const isSolanaSwap = useSelector(getIsSolanaSwap);
  const dispatch = useDispatch();

  const [showAllQuotes, setShowAllQuotes] = useState(false);

  const getNetworkImage = (chainId: string | number) => {
    if (isSolanaChainId(chainId)) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.SOLANA];
    }
    return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      formatChainIdToHex(
        chainId,
      ) as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];
  };

  const getNetworkName = (chainId: string | number) => {
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
              {activeQuote.quote.gasIncluded && (
                <Row gap={1}>
                  <Text style={{ textDecoration: 'line-through' }}>
                    {activeQuote.includedTxFees?.valueInCurrency
                      ? formatCurrencyAmount(
                          activeQuote.includedTxFees.valueInCurrency,
                          currency,
                          2,
                        )
                      : formatCurrencyAmount(
                          activeQuote.totalMaxNetworkFee?.valueInCurrency,
                          currency,
                          2,
                        )}
                  </Text>
                  <Text fontStyle={FontStyle.Italic}>{' Included'}</Text>
                </Row>
              )}
              {!activeQuote.quote.gasIncluded && (
                <Text>
                  {formatCurrencyAmount(
                    activeQuote.totalMaxNetworkFee?.valueInCurrency,
                    currency,
                    2,
                  )}
                </Text>
              )}
            </Row>

            {/* Slippage */}
            <Row justifyContent={JustifyContent.spaceBetween}>
              <Row gap={1}>
                <Text
                  variant={TextVariant.bodyMd}
                  color={TextColor.textAlternative}
                >
                  {t('slippage')}
                </Text>
                <ButtonIcon
                  iconName={IconName.Edit}
                  size={ButtonIconSize.Sm}
                  color={IconColor.iconAlternative}
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
                            getNativeAssetForChainId(fromChain.chainId).symbol,
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
                          gas_included: Boolean(activeQuote.quote?.gasIncluded),
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
