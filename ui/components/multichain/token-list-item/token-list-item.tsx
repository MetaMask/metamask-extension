import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import classnames from 'clsx';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { type Hex } from '@metamask/utils';
import { type KeyringAccountType } from '@metamask/keyring-api';
import { Button, ButtonVariant } from '@metamask/design-system-react';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { TokenInsightsModal } from '../../../pages/bridge/token-insights-modal';
import { useRWAToken } from '../../../pages/bridge/hooks/useRWAToken';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SensitiveText,
  SensitiveTextLength,
  Tag,
  Text,
} from '../../component-library';
import { MarketClosedModal } from '../../app/assets/market-closed-modal';
import { StockBadge } from '../../app/assets/stock-badge/stock-badge';
import { getMarketData, getCurrencyRates } from '../../../selectors';

import { getMultichainIsEvm } from '../../../selectors/multichain';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CURRENCY_SYMBOLS,
  NON_EVM_CURRENCY_SYMBOLS,
} from '../../../../shared/constants/network';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../store/actions';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { selectNoFeeAssets } from '../../../ducks/bridge/selectors';
import { ACCOUNT_TYPE_LABELS } from '../../app/assets/constants';
import { TokenWithFiatAmount } from '../../app/assets/types';
import { PercentageChange } from './price/percentage-change/percentage-change';
import { StakeableLink } from './stakeable-link';

type MarketDataMap = ReturnType<typeof getMarketData>;
type CurrencyRatesMap = ReturnType<typeof getCurrencyRates>;
type NetworkConfigurationsMap = ReturnType<
  typeof getNetworkConfigurationsByChainId
>;

// Stable empty fallback objects returned by the "no-op" selectors below so
// that useSelector never triggers a re-render when the value has not changed.
const EMPTY_MARKET_DATA: MarketDataMap = {};
const EMPTY_CURRENCY_RATES: CurrencyRatesMap = {};
const EMPTY_NETWORK_CONFIGURATIONS: NetworkConfigurationsMap = {};

// Stable selector references for when the parent already provides the data as
// props. Using these instead of the real selectors prevents the component from
// subscribing to those Redux slices, eliminating redundant per-row subscriptions.
// They are typed as the same selector type so useMemo can return a single type
// that useSelector can infer without unsafe casts.
const selectEmptyMarketData: typeof getMarketData = () => EMPTY_MARKET_DATA;
const selectEmptyCurrencyRates: typeof getCurrencyRates = () =>
  EMPTY_CURRENCY_RATES;
const selectEmptyNetworkConfigurations: typeof getNetworkConfigurationsByChainId =
  () => EMPTY_NETWORK_CONFIGURATIONS;

type TokenListItemProps = {
  className?: string;
  onClick?: (arg?: string) => void;
  tokenSymbol?: string;
  tokenImage: string;
  primary?: string;
  secondary?: string | null;
  title: string;
  tooltipText?: string;
  isNativeCurrency?: boolean;
  isStakeable?: boolean;
  isTitleNetworkName?: boolean;
  isTitleHidden?: boolean;
  tokenChainImage?: string;
  chainId: string;
  address?: string | null;
  showPercentage?: boolean;
  privacyMode?: boolean;
  nativeCurrencySymbol?: string;
  isDestinationToken?: boolean;
  accountType?: KeyringAccountType;
  rwaData?: TokenWithFiatAmount['rwaData'];
  /**
   * Pre-fetched market data from parent. When provided, avoids a per-row
   * Redux subscription to `getMarketData`.
   */
  marketData?: MarketDataMap;
  /**
   * Pre-fetched currency rates from parent. When provided, avoids a per-row
   * Redux subscription to `getCurrencyRates`.
   */
  currencyRates?: CurrencyRatesMap;
  /**
   * Pre-fetched network configurations from parent. When provided, avoids a
   * per-row Redux subscription to `getNetworkConfigurationsByChainId`.
   */
  networkConfigurations?: NetworkConfigurationsMap;
};

export const TokenListItemComponent = ({
  className,
  onClick,
  tokenSymbol,
  tokenImage,
  primary,
  secondary,
  title,
  tooltipText,
  tokenChainImage,
  chainId,
  isNativeCurrency = false,
  isStakeable = false,
  isTitleNetworkName = false,
  isTitleHidden = false,
  address = null,
  showPercentage = false,
  accountType,
  privacyMode = false,
  nativeCurrencySymbol,
  isDestinationToken = false,
  rwaData,
  marketData: marketDataProp,
  currencyRates: currencyRatesProp,
  networkConfigurations: networkConfigurationsProp,
}: TokenListItemProps) => {
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const noFeeAssets = useSelector((state) => selectNoFeeAssets(state, chainId));

  // When the parent passes these props it has already read the selectors once
  // for the whole list. Switch to a no-op selector so this row does not create
  // an independent Redux subscription for shared global data.
  //
  // Why boolean flags instead of listing the props as useMemo deps directly:
  // The props are object references that change on every render of the parent,
  // so including them in the dep array would defeat the purpose. We only want
  // to recompute when the prop transitions between defined and undefined.
  // A boolean flag captures exactly that signal without referencing the prop
  // object, satisfying react-hooks/exhaustive-deps without needing an eslint-
  // disable comment (which would prevent React Compiler from optimising this
  // component).
  const isMarketDataPropProvided = marketDataProp !== undefined;
  const isCurrencyRatesPropProvided = currencyRatesProp !== undefined;
  const isNetworkConfigurationsPropProvided =
    networkConfigurationsProp !== undefined;

  const marketDataSelector = useMemo(
    () => (isMarketDataPropProvided ? selectEmptyMarketData : getMarketData),
    [isMarketDataPropProvided],
  );
  const currencyRatesSelector = useMemo(
    () =>
      isCurrencyRatesPropProvided ? selectEmptyCurrencyRates : getCurrencyRates,
    [isCurrencyRatesPropProvided],
  );
  const networkConfigurationsSelector = useMemo(
    () =>
      isNetworkConfigurationsPropProvided
        ? selectEmptyNetworkConfigurations
        : getNetworkConfigurationsByChainId,
    [isNetworkConfigurationsPropProvided],
  );

  const marketDataFromStore = useSelector(marketDataSelector);
  const currencyRatesFromStore = useSelector(currencyRatesSelector);
  const networkConfigurationsFromStore = useSelector(
    networkConfigurationsSelector,
  );

  // Prefer lifted props; fall back to store values for callers that have not
  // been updated to pass these props.
  const multiChainMarketData = marketDataProp ?? marketDataFromStore;
  const currencyRates = currencyRatesProp ?? currencyRatesFromStore;
  const allNetworks =
    networkConfigurationsProp ?? networkConfigurationsFromStore;

  // We do not want to display any percentage with non-EVM since we don't have the data for this yet. So
  // we only use this option for EVM here:
  const shouldShowPercentage = isEvm && showPercentage;

  const isOriginalTokenSymbol = tokenSymbol && currencyRates[tokenSymbol];

  // Scam warning
  const showScamWarning =
    isNativeCurrency && !isOriginalTokenSymbol && shouldShowPercentage;

  const dispatch = useDispatch();
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const navigate = useNavigate();
  const [showTokenInsights, setShowTokenInsights] = useState(false);
  const [showMarketClosedModal, setShowMarketClosedModal] = useState(false);

  const getTokenTitle = () => {
    if (isTitleNetworkName) {
      return NETWORK_TO_SHORT_NETWORK_NAME_MAP[
        chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
      ];
    }
    if (isTitleHidden) {
      return undefined;
    }
    switch (title) {
      case CURRENCY_SYMBOLS.ETH:
        return t('networkNameEthereum');
      case NON_EVM_CURRENCY_SYMBOLS.BTC:
        return t('networkNameBitcoin');
      case NON_EVM_CURRENCY_SYMBOLS.SOL:
        return t('networkNameSolana');
      default:
        return title;
    }
  };

  const tokenPercentageChange = address
    ? multiChainMarketData?.[chainId as Hex]?.[address as Hex]
        ?.pricePercentChange1d
    : null;

  const tokenTitle = getTokenTitle();
  const tokenMainTitleToDisplay =
    shouldShowPercentage && !isTitleNetworkName ? tokenTitle : tokenSymbol;

  const isNoFeeAsset =
    isDestinationToken &&
    address &&
    noFeeAssets?.includes(address.toLowerCase());
  const { isStockToken: checkIsStockToken, isTokenTradingOpen } = useRWAToken();
  const rwaToken = { rwaData };
  const isRWAToken = checkIsStockToken(rwaToken);

  // Used for badge icon (resolved from props or Redux store above)

  return (
    <Box
      className={classnames('multichain-token-list-item', className || {})}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      width={BlockSize.Full}
      height={BlockSize.Full}
      gap={4}
      data-testid="multichain-token-list-item"
      title={tooltipText ? t(tooltipText) : undefined}
    >
      <Box
        className={classnames('multichain-token-list-item__container-cell', {
          'multichain-token-list-item__container-cell--clickable':
            onClick !== undefined,
        })}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
        style={{ height: 62 }}
        data-testid="multichain-token-list-button"
        {...(onClick && {
          as: 'a',
          href: '#',
          onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            e.preventDefault();

            if (showScamWarningModal || showMarketClosedModal) {
              return;
            }

            if (isRWAToken && !isTokenTradingOpen(rwaToken)) {
              setShowMarketClosedModal(true);
              return;
            }

            onClick();
            trackEvent(
              createEventBuilder(MetaMetricsEventName.TokenDetailsOpened)
                .addCategory(MetaMetricsEventCategory.Tokens)
                .addProperties({
                  location: 'Home',
                  // FIXME: This might not be a number for non-EVM accounts
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  chain_id: chainId,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  token_symbol: tokenSymbol,
                })
                .build(),
            );
          },
        })}
      >
        <BadgeWrapper
          badge={
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={allNetworks?.[chainId as Hex]?.name}
              src={tokenChainImage || undefined}
              backgroundColor={BackgroundColor.backgroundDefault}
              borderWidth={2}
              className="multichain-token-list-item__badge__avatar-network"
            />
          }
          marginRight={4}
          className="multichain-token-list-item__badge"
        >
          <AvatarToken name={tokenSymbol} src={tokenImage} />
        </BadgeWrapper>
        <Box
          className="multichain-token-list-item__container-cell--text-container"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
          style={{ flexGrow: 1, overflow: 'hidden' }}
          justifyContent={JustifyContent.center}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              {title?.length > 12 ? (
                <Tooltip
                  position="bottom"
                  html={title}
                  tooltipInnerClassName="multichain-token-list-item__tooltip"
                >
                  <Text
                    as="span"
                    fontWeight={FontWeight.Medium}
                    variant={TextVariant.bodyMd}
                    display={Display.Block}
                    ellipsis
                  >
                    {tokenMainTitleToDisplay}
                    {isStakeable && (
                      <StakeableLink chainId={chainId} symbol={tokenSymbol} />
                    )}
                  </Text>
                </Tooltip>
              ) : (
                <Text
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.bodyMd}
                  ellipsis
                >
                  {tokenMainTitleToDisplay}
                  {isStakeable && (
                    <StakeableLink chainId={chainId} symbol={tokenSymbol} />
                  )}
                </Text>
              )}
              {accountType && ACCOUNT_TYPE_LABELS[accountType] && (
                <Tag label={ACCOUNT_TYPE_LABELS[accountType]} />
              )}
              {isRWAToken ? (
                <StockBadge isMarketClosed={!isTokenTradingOpen(rwaToken)} />
              ) : null}
              {isNoFeeAsset && <Tag label={t('bridgeNoMMFee')} />}
            </Box>

            {showScamWarning ? (
              <ButtonIcon
                iconName={IconName.Danger}
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                ) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowScamWarningModal(true);
                }}
                color={IconColor.errorDefault}
                size={ButtonIconSize.Md}
                backgroundColor={BackgroundColor.transparent}
                data-testid="scam-warning"
                ariaLabel=""
              />
            ) : (
              <SensitiveText
                fontWeight={FontWeight.Medium}
                variant={TextVariant.bodyMd}
                textAlign={TextAlign.End}
                data-testid="multichain-token-list-item-secondary-value"
                ellipsis={isStakeable}
                isHidden={privacyMode}
                length={SensitiveTextLength.Medium}
              >
                {secondary}
              </SensitiveText>
            )}
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            {shouldShowPercentage ? (
              <PercentageChange
                value={
                  isNativeCurrency
                    ? multiChainMarketData?.[chainId as Hex]?.[
                        getNativeTokenAddress(chainId as Hex)
                      ]?.pricePercentChange1d
                    : tokenPercentageChange
                }
                address={
                  isNativeCurrency
                    ? getNativeTokenAddress(chainId as Hex)
                    : (address as `0x${string}`)
                }
              />
            ) : (
              <Text
                variant={TextVariant.bodySmMedium}
                color={TextColor.textAlternative}
                data-testid="multichain-token-list-item-token-name"
                ellipsis
              >
                {tokenTitle}
              </Text>
            )}

            {showScamWarning ? (
              <SensitiveText
                data-testid="multichain-token-list-item-value"
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMd}
                textAlign={TextAlign.End}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {primary}
              </SensitiveText>
            ) : (
              <SensitiveText
                data-testid="multichain-token-list-item-value"
                color={TextColor.textAlternative}
                variant={TextVariant.bodySmMedium}
                textAlign={TextAlign.End}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {primary}
              </SensitiveText>
            )}
          </Box>
        </Box>

        {isDestinationToken && (
          <ButtonIcon
            iconName={IconName.Info}
            size={ButtonIconSize.Sm}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              setShowTokenInsights(true);
            }}
            className="multichain-token-list-item__info-icon"
            color={IconColor.iconAlternative}
            ariaLabel={t('viewTokenDetails')}
          />
        )}
      </Box>
      {isEvm && showScamWarningModal ? (
        <Modal isOpen onClose={() => setShowScamWarningModal(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={() => setShowScamWarningModal(false)}>
              {t('nativeTokenScamWarningTitle')}
            </ModalHeader>
            <ModalBody marginTop={4} marginBottom={4}>
              {t('nativeTokenScamWarningDescription', [
                tokenSymbol,
                nativeCurrencySymbol ||
                  t('nativeTokenScamWarningDescriptionExpectedTokenFallback'), // never render "undefined" string value
              ])}
            </ModalBody>
            <ModalFooter>
              <Button
                variant={ButtonVariant.Secondary}
                onClick={() => {
                  dispatch(setEditedNetwork({ chainId }));
                  navigate(NETWORKS_ROUTE);
                }}
                isFullWidth
              >
                {t('nativeTokenScamWarningConversion')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}

      {showMarketClosedModal && (
        <MarketClosedModal
          isOpen={showMarketClosedModal}
          onClose={() => setShowMarketClosedModal(false)}
        />
      )}

      {showTokenInsights && (
        <TokenInsightsModal
          isOpen={showTokenInsights}
          onClose={() => setShowTokenInsights(false)}
          token={{
            address,
            symbol: tokenSymbol || title,
            name: title,
            chainId,
            iconUrl: tokenImage,
          }}
        />
      )}
    </Box>
  );
};

export const TokenListItem = React.memo(TokenListItemComponent);
