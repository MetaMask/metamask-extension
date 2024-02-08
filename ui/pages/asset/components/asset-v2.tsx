import React, { useContext, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ReactNode } from 'react-markdown';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getIsBridgeChain,
  getIsBuyableChain,
  getIsSwapsChain,
  getPreferences,
} from '../../../selectors';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  ButtonSecondarySize,
  Text,
} from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AddressCopyButton,
  TokenListItem,
} from '../../../components/multichain';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { startNewDraftTransaction } from '../../../ducks/send';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import { SEND_ROUTE } from '../../../helpers/constants/routes';
import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { MINUTE } from '../../../../shared/constants/time';
import TokenCell from '../../../components/app/token-cell';
import TransactionList from '../../../components/app/transaction-list';
import Tooltip from '../../../components/ui/tooltip';
import AssetChart from './asset-chart';
import { getPricePrecision, localizeLargeNumber } from './util';
import AssetHeader from './asset-header';

const renderRow = (leftColumn: string, rightColumn: ReactNode) => (
  <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
    <Text color={TextColor.textAlternative} variant={TextVariant.bodyMdMedium}>
      {leftColumn}
    </Text>
    {rightColumn}
  </Box>
);

const renderTooltip = (button: JSX.Element, text: string, show: boolean) =>
  show ? (
    <Tooltip wrapperClassName="asset-tooltip" title={text} position="bottom">
      {button}
    </Tooltip>
  ) : (
    <Box width={BlockSize.Full}>{button}</Box>
  );

// A page representing details for a native or token asset
const AssetV2 = ({
  asset,
}: {
  asset: (
    | {
        type: AssetType.native;
        isOriginalNativeSymbol: boolean;
      }
    | {
        type: AssetType.token;
        address: string;
        decimals: number;
        aggregators?: [];
      }
  ) & {
    symbol: string;
    name?: string;
    image: string;
    balance?: string;
    fiatDisplay?: string;
    optionsButton: React.ReactNode;
  };
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const chainId = hexToDecimal(useSelector(getCurrentChainId));
  const currency = useSelector(getCurrentCurrency);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);

  const [marketData, setMarketData] = useState<any>();
  const [balanceInView, setBalanceInView] = useState(true);

  const balanceRef = useRef(null);

  const { type, symbol, name, image, balance, fiatDisplay, optionsButton } =
    asset;

  const address =
    type === AssetType.token
      ? asset.address
      : '0x0000000000000000000000000000000000000000';

  useEffect(() => {
    setMarketData(undefined);

    // TODO: Consider exposing HTTP request through a controller
    fetchWithCache({
      url: `https://price-api.metafi.codefi.network/v2/chains/${chainId}/spot-prices/?includeMarketData=true&tokenAddresses=${address}&vsCurrency=${currency}`,
      cacheOptions: { cacheRefreshTime: MINUTE },
      functionName: 'GetAssetMarketData',
    })
      .catch(() => null)
      .then((data) => setMarketData(data?.[address.toLowerCase()]));
  }, [chainId, address, currency]);

  // Show balance in header when it's no longer in view
  useEffect(() => {
    if (balanceRef?.current) {
      const observer = new IntersectionObserver(
        (entries) => setBalanceInView(entries[0].isIntersecting),
        { threshold: 1 },
      );
      observer.observe(balanceRef.current);
      return () => observer.disconnect();
    }
    return undefined;
  }, [balanceRef]);

  return (
    <>
      <AssetHeader
        type={type}
        symbol={symbol}
        image={image}
        showBalance={!balanceInView}
        balance={balance}
        fiatDisplay={fiatDisplay}
        optionsButton={optionsButton}
      />
      <Box padding={4} paddingBottom={0}>
        <Text color={TextColor.textAlternative}>
          {name ? `${name} (${symbol})` : symbol}
        </Text>
      </Box>
      <AssetChart address={address} currentPrice={marketData?.price} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingTop={6}
        gap={6}
        // todo this shadow on dark theme
        style={{ boxShadow: '0px -15px 15px -15px gray inset' }}
      >
        <Box>
          <Text
            variant={TextVariant.headingMd}
            paddingBottom={2}
            paddingLeft={4}
          >
            {t('yourBalance')}
          </Text>
          <Box ref={balanceRef}>
            {asset.type === AssetType.native ? (
              <TokenListItem
                title={symbol}
                tokenSymbol={symbol}
                primary={
                  useNativeCurrencyAsPrimaryCurrency ? balance : fiatDisplay
                }
                secondary={
                  useNativeCurrencyAsPrimaryCurrency ? fiatDisplay : balance
                }
                tokenImage={image}
                isOriginalTokenSymbol={asset.isOriginalNativeSymbol}
                isNativeCurrency
              />
            ) : (
              <TokenCell
                address={address}
                image={image}
                symbol={symbol}
                string={balance}
              />
            )}
          </Box>
          <Box display={Display.Flex} gap={4} paddingLeft={4} paddingRight={4}>
            {renderTooltip(
              <ButtonSecondary
                disabled={!isBridgeChain}
                padding={5}
                width={BlockSize.Full}
                // TODO: bridge onclick
              >
                {t('bridge')}
              </ButtonSecondary>,
              t('currentlyUnavailable'),
              !isBridgeChain,
            )}

            <Box width={BlockSize.Full}>
              <ButtonSecondary
                padding={5}
                width={BlockSize.Full}
                onClick={async () => {
                  trackEvent({
                    event: MetaMetricsEventName.NavSendButtonClicked,
                    category: MetaMetricsEventCategory.Navigation,
                    properties: {
                      token_symbol: symbol,
                      location: MetaMetricsSwapsEventSource.TokenView,
                      text: 'Send',
                      chain_id: chainId,
                    },
                  });
                  try {
                    await dispatch(
                      startNewDraftTransaction({
                        type,
                        details:
                          type === AssetType.native
                            ? undefined
                            : {
                                standard: TokenStandard.ERC20,
                                decimals: asset.decimals,
                                symbol,
                                address,
                              },
                      }),
                    );
                    history.push(SEND_ROUTE);
                  } catch (err: any) {
                    if (!err?.message?.includes(INVALID_ASSET_TYPE)) {
                      throw err;
                    }
                  }
                }}
              >
                {t('send')}
              </ButtonSecondary>
            </Box>
          </Box>
        </Box>
        {type === AssetType.token && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            paddingLeft={4}
            paddingRight={4}
          >
            <Text variant={TextVariant.headingMd} paddingBottom={4}>
              {t('tokenDetails')}
            </Text>
            {renderRow(
              t('contractAddress'),
              <AddressCopyButton address={address} shorten />,
            )}
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {asset.decimals !== undefined &&
                renderRow(t('tokenDecimal'), <Text>{asset.decimals}</Text>)}
              {asset.aggregators && asset.aggregators?.length > 0 && (
                <Box>
                  <Text
                    color={TextColor.textAlternative}
                    variant={TextVariant.bodyMdMedium}
                  >
                    {'Token list'} {/* TODO localize */}
                  </Text>
                  <Text>{asset.aggregators?.join(', ')}</Text>
                </Box>
              )}
            </Box>
          </Box>
        )}
        {(marketData?.marketCap > 0 ||
          marketData?.totalVolume > 0 ||
          marketData?.circulatingSupply > 0 ||
          marketData?.allTimeHigh > 0 ||
          marketData?.allTimeLow > 0) && (
          <Box paddingLeft={4} paddingRight={4}>
            <Text variant={TextVariant.headingMd} paddingBottom={4}>
              {t('marketDetails')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {marketData?.marketCap > 0 &&
                renderRow(
                  t('marketCap'),
                  <Text>{localizeLargeNumber(t, marketData.marketCap)}</Text>,
                )}
              {marketData?.totalVolume > 0 &&
                renderRow(
                  t('totalVolume'),
                  <Text>{localizeLargeNumber(t, marketData.totalVolume)}</Text>,
                )}
              {marketData?.totalVolume > 0 &&
                marketData?.marketCap > 0 &&
                renderRow(
                  `${t('volume')} / ${t('marketCap')}`,
                  <Text>
                    {(
                      marketData.totalVolume / marketData.marketCap
                    ).toPrecision(4)}
                  </Text>,
                )}
              {marketData?.circulatingSupply > 0 &&
                renderRow(
                  t('circulatingSupply'),
                  <Text>
                    {localizeLargeNumber(t, marketData.circulatingSupply)}
                  </Text>,
                )}
              {marketData?.allTimeHigh > 0 &&
                renderRow(
                  t('allTimeHigh'),
                  <Text>
                    {formatCurrency(
                      marketData.allTimeHigh,
                      currency,
                      getPricePrecision(marketData.allTimeHigh),
                    )}
                  </Text>,
                )}
              {marketData?.allTimeLow > 0 &&
                renderRow(
                  t('allTimeLow'),
                  <Text>
                    {formatCurrency(
                      marketData.allTimeLow,
                      currency,
                      getPricePrecision(marketData.allTimeLow),
                    )}
                  </Text>,
                )}
            </Box>
          </Box>
        )}
        <Box marginBottom={7}>
          <Text
            paddingLeft={4}
            paddingRight={4}
            variant={TextVariant.headingMd}
          >
            {t('yourActivity')}
          </Text>
          {type === AssetType.native ? (
            <TransactionList hideTokenTransactions />
          ) : (
            <TransactionList tokenAddress={address} />
          )}
        </Box>
      </Box>
      <Box
        padding={4}
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{
          position: 'sticky',
          bottom: 0,
          // todo shadow on dark theme
          boxShadow: 'lightgrey 0px 0px 12px 0px',
        }}
      >
        <Box display={Display.Flex} gap={4}>
          {renderTooltip(
            <ButtonSecondary
              disabled={!isBuyableChain}
              size={ButtonSecondarySize.Md}
              padding={5}
              width={BlockSize.Full}
            >
              {t('buy')}
              {/* TODO: Implement buy onClick */}
            </ButtonSecondary>,
            t('currentlyUnavailable'),
            !isBuyableChain,
          )}
          {renderTooltip(
            <ButtonPrimary
              disabled={!isSwapsChain}
              padding={5}
              width={BlockSize.Full}
            >
              {t('swap')}
              {/* TODO: Implement swap onClick */}
            </ButtonPrimary>,
            t('currentlyUnavailable'),
            !isBridgeChain,
          )}
        </Box>
      </Box>
    </>
  );
};

export default AssetV2;
