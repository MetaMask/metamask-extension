import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ReactNode } from 'react-markdown';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getPreferences,
} from '../../../selectors';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  Text,
} from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AddressCopyButton } from '../../../components/multichain';
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
import AssetChart from './asset-chart';
import { getPricePrecision, localizeLargeNumber } from './util';

const renderRow = (leftColumn: string, rightColumn: ReactNode) => (
  <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
    <Text color={TextColor.textAlternative} variant={TextVariant.bodyMdMedium}>
      {leftColumn}
    </Text>
    {rightColumn}
  </Box>
);

// A page representing details for a native or token asset
const AssetV2 = ({
  asset,
}: {
  asset: (
    | {
        type: AssetType.native;
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
    balanceDisplay?: string;
    fiatDisplay?: string;
  };
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const chainId = hexToDecimal(useSelector(getCurrentChainId));
  const currency = useSelector(getCurrentCurrency);

  const [marketData, setMarketData] = useState<any>();

  const { type, symbol, name, image, balanceDisplay, fiatDisplay } = asset;
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

  return (
    // TODO: Header with back button on left and and ... kebab menu on right
    <Box>
      <Box padding={4} paddingBottom={0}>
        <Text color={TextColor.textAlternative}>
          {name ? `${name} (${symbol})` : symbol}
        </Text>
      </Box>
      <AssetChart address={address} currentPrice={marketData?.price} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
        paddingTop={6}
        gap={6}
        // todo this shadow on dark theme
        style={{ boxShadow: '0px -15px 15px -15px gray inset' }}
      >
        <Box>
          <Text variant={TextVariant.headingMd} paddingBottom={2}>
            {t('yourBalance')}
          </Text>
          <Box
            paddingTop={1}
            paddingBottom={2}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Box display={Display.Flex} alignItems={AlignItems.center}>
              <AvatarToken src={image} size={AvatarTokenSize.Md} />
              <Text variant={TextVariant.bodyLgMedium} paddingLeft={3}>
                {name ?? symbol}
              </Text>
            </Box>
            <Box>
              <Text
                variant={TextVariant.bodyLgMedium}
                textAlign={TextAlign.Right}
              >
                {useNativeCurrencyAsPrimaryCurrency
                  ? balanceDisplay
                  : fiatDisplay}
              </Text>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
                textAlign={TextAlign.Right}
              >
                {useNativeCurrencyAsPrimaryCurrency
                  ? fiatDisplay
                  : balanceDisplay}
              </Text>
            </Box>
          </Box>
          <Box display={Display.Flex} gap={4} paddingTop={2}>
            <ButtonSecondary padding={5} width={BlockSize.Full}>
              {t('bridge')}
              {/* TODO: Implement bridge onClick */}
            </ButtonSecondary>
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
        {type === AssetType.token && (
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
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
              {asset.aggregators !== undefined && (
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
          <Box>
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
        {/* TODO: Transaction history */}
        {/* <Text variant={TextVariant.headingMd}>{t('yourActivity')}</Text> */}
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
          <ButtonSecondary
            size={ButtonSecondarySize.Md}
            padding={5}
            width={BlockSize.Full}
          >
            {t('buy')}
            {/* TODO: Implement buy onClick */}
          </ButtonSecondary>
          <ButtonPrimary
            size={ButtonPrimarySize.Md}
            padding={5}
            width={BlockSize.Full}
          >
            {t('swap')}
            {/* TODO: Implement swap onClick */}
          </ButtonPrimary>
        </Box>
      </Box>
    </Box>
  );
};

export default AssetV2;
