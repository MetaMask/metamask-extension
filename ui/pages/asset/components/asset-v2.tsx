import React, { useContext, useEffect, useState } from 'react';
import 'chartjs-adapter-moment';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getCurrentChainId, getCurrentCurrency } from '../../../selectors';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
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
import { getPricePrecision } from './util';
import AssetChart from './asset-chart';

/**
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2B for billions, 3M for millions, 456,789 for thousands, etc.
 *
 * @param t - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
const formatNumber = (t: any, number: number) => {
  if (number >= 1000000000000) {
    return `${(number / 1000000000000).toFixed(2)}${t('trillionAbbreviation')}`;
  } else if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(2)}${t('billionAbbreviation')}`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(2)}${t('millionAbbreviation')}`;
  }
  return number.toFixed(2);
};

const renderRow = (leftColumn: string, rightColumn: string) => (
  <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
    {/* // left should be grey/alternative */}
    <Text variant={TextVariant.bodyMdMedium}>{leftColumn}</Text>
    <Text variant={TextVariant.bodyMd}>{rightColumn}</Text>
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
      }
  ) & {
    symbol: string;
    name?: string;
    image: string;
    balance: string;
  };
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const chainId = hexToDecimal(useSelector(getCurrentChainId));
  const currency = useSelector(getCurrentCurrency);
  const [spotPrices, setSpotPrices] = useState<any>();

  const { type, symbol, name, image, balance } = asset;
  const address =
    type === AssetType.token
      ? asset.address
      : '0x0000000000000000000000000000000000000000';

  // TODO: consider exposing this fetch through a controller
  useEffect(() => {
    setSpotPrices(undefined);
    fetch(
      `https://price-api.metafi.codefi.network/v2/chains/${chainId}/spot-prices/?tokenAddresses=${address}&vsCurrency=${currency}&includeMarketData=true`,
    )
      .then((resp) => (resp.status === 200 ? resp.json() : null))
      .then((data) => setSpotPrices(data?.[address.toLowerCase()]));
  }, [chainId, address, currency]);

  return (
    // TODO: Header with back button on left and and ... kebab menu on right
    <Box>
      <Box padding={4} paddingBottom={0}>
        <Text>{name ? `${name} (${symbol})` : symbol}</Text>
        <Text variant={TextVariant.headingLg}>
          {spotPrices?.price
            ? formatCurrency(
                spotPrices.price,
                currency,
                getPricePrecision(spotPrices.price),
              )
            : ''}
        </Text>
      </Box>
      <AssetChart address={address} symbol={symbol} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
        paddingTop={9}
        gap={6}
        style={{boxShadow:'0px -15px 15px -15px gray inset'}} // todo dark theme?
      >
        <Text variant={TextVariant.headingMd}>{t('yourBalance')}</Text>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <AvatarToken src={image} size={AvatarTokenSize.Md} />
            <Text paddingLeft={3} >
              {name ?? symbol}
            </Text>
          </Box>
          <Box>
            <Text >
              {balance} {symbol}
              {/* TODO: Try to show fiat value of balance here */}
            </Text>
          </Box>
        </Box>
        <Box display={Display.Flex} gap={4}>
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
        {type === AssetType.token ? (
          <>
            <Text variant={TextVariant.headingMd}>{t('tokenDetails')}</Text>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                {/* button is lower line height than "contract addtres " text */}
                <Text>{t('contractAddress')}</Text>
                <AddressCopyButton address={address} shorten />
              </Box>
              {asset.decimals === undefined ? undefined : (
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text>{t('tokenDecimal')}</Text>
                  <Text>{asset.decimals}</Text>
                </Box>
              )}
            </Box>
          </>


// for sectiona, 16 gap between sections and 8 between items within section
        ) : undefined}
        {spotPrices?.marketCap > 0 ||
        spotPrices?.totalVolume > 0 ||
        spotPrices?.circulatingSupply > 0 ||
        spotPrices?.allTimeHigh > 0 ||
        spotPrices?.allTimeLow > 0 ? (
          <>
            <Text variant={TextVariant.headingMd}>{t('marketDetails')}</Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={3}
            >
              {spotPrices?.marketCap > 0
                ? renderRow(
                    t('marketCap'),
                    formatNumber(t, spotPrices.marketCap),
                  )
                : undefined}
              {spotPrices?.totalVolume > 0
                ? renderRow(
                    t('totalVolume'),
                    formatNumber(t, spotPrices.totalVolume),
                  )
                : undefined}
              {spotPrices?.totalVolume > 0 && spotPrices?.marketCap > 0
                ? renderRow(
                    `${t('volume')} / ${t('marketCap')}`,
                    (spotPrices.totalVolume / spotPrices.marketCap).toPrecision(
                      4,
                    ),
                  )
                : undefined}
              {spotPrices?.circulatingSupply > 0
                ? renderRow(
                    t('circulatingSupply'),
                    formatNumber(t, spotPrices.circulatingSupply),
                  )
                : undefined}
              {spotPrices?.allTimeHigh > 0
                ? renderRow(
                    t('allTimeHigh'),
                    formatCurrency(
                      spotPrices.allTimeHigh,
                      currency,
                      getPricePrecision(spotPrices.allTimeHigh),
                    ),
                  )
                : undefined}
              {spotPrices?.allTimeLow > 0
                ? renderRow(
                    t('allTimeLow'),
                    formatCurrency(
                      spotPrices.allTimeLow,
                      currency,
                      getPricePrecision(spotPrices.allTimeLow),
                    ),
                  )
                : undefined}
            </Box>
          </>
        ) : undefined}
        <Text variant={TextVariant.headingMd}>{t('yourActivity')}</Text>
        {/* TODO: Transaction history */}
      </Box>
      <Box
        padding={4}
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{ position: 'sticky', bottom: 0, boxShadow: 'lightgrey 0px 0px 12px 0px' }} // todo dark theme?
      >
        <Box display={Display.Flex} gap={4}>
          <ButtonSecondary
            size={ButtonSecondarySize.Md}
            padding={5}
            width={BlockSize.Full}
            onClick={async () => {}}
          >
            {t('buy')}
          </ButtonSecondary>
          <ButtonPrimary
            size={ButtonPrimarySize.Md}
            padding={5}
            width={BlockSize.Full}
            onClick={async () => {}}
          >
            {t('swap')}
          </ButtonPrimary>
        </Box>
      </Box>
    </Box>
  );
};

export default AssetV2;
