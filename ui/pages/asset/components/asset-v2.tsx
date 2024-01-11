import React, { useContext, useEffect, useState } from 'react';
import 'chartjs-adapter-moment';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getCurrentChainId, getCurrentCurrency } from '../../../selectors';
import {
  AlignItems,
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
  ButtonSecondary,
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
import { getPrecision } from './util';
import AssetChart from './asset-chart';

const renderRow = (leftColumn: string, rightColumn: string) => (
  <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
    <Text>{leftColumn}</Text>
    <Text>{rightColumn}</Text>
  </Box>
);

const formatNumber = (number: number) => {
  // TODO: Localize trillion/billion/million abbreviations
  if (number >= 1000000000000) {
    return `${(number / 1000000000000).toFixed(2)}T`;
  } else if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(2)}B`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(2)}M`;
  }
  return number.toFixed(2);
};

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
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();

  const chainId = hexToDecimal(useSelector(getCurrentChainId));
  const currency = useSelector(getCurrentCurrency);
  const [spotPrices, setSpotPrices] = useState<any>(); // todo better type?

  const { type, symbol, name, image, balance } = asset;
  const address =
    type === AssetType.token
      ? asset.address
      : '0x0000000000000000000000000000000000000000';

  // todo canonicalize address?  is that necessary?
  // cache these when clicking between???? for a limited amount of time?

  useEffect(() => {
    setSpotPrices(undefined);
    fetch(
      `https://price-api.metafi-dev.codefi.network/v2/chains/${chainId}/spot-prices/?tokenAddresses=${address}&vsCurrency=${currency}&includeMarketData=true`,
    )
      // todo canonicalize address anywhere?
      .then((resp) => (resp.status === 200 ? resp.json() : null))
      .then((data) => setSpotPrices(data?.[address.toLowerCase()]));
  }, [chainId, address, currency]);

  // TODO: Back button to return to home page
  return (
    <Box>
      <Box padding={4} paddingBottom={0}>
        <Text>{name ? `${name} (${symbol})` : symbol}</Text>
        <Text variant={TextVariant.headingLg}>
          {spotPrices?.price
            ? formatCurrency(
                spotPrices.price,
                currency,
                getPrecision(spotPrices.price),
              )
            : ''}
        </Text>
      </Box>
      <AssetChart address={address} symbol={symbol} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
        paddingTop={7}
        gap={7}
      >
        <Text variant={TextVariant.headingMd}>{t('yourBalance')}</Text>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <AvatarToken src={image} size={AvatarTokenSize.Md} />
            <Text paddingLeft={3} variant={TextVariant.bodyMdBold}>
              {name ?? symbol}
            </Text>
          </Box>
          <Box>
            <Text variant={TextVariant.bodyMdBold}>
              {balance} {symbol}
            </Text>
          </Box>
        </Box>
        <Box display={Display.Flex} gap={4}>
          <ButtonSecondary padding={5} width={BlockSize.Full}>
            {t('bridge')}
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
                <Text>{t('contractAddress')}</Text>
                <AddressCopyButton address={address} shorten />
              </Box>
              {asset.decimals === undefined ? undefined : (
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text>Token Decimal</Text>
                  <Text>{asset.decimals}</Text>
                </Box>
              )}
            </Box>
          </>
        ) : undefined}
        {spotPrices?.marketCap !== undefined ||
        spotPrices?.totalVolume !== undefined ||
        spotPrices?.circulatingSupply !== undefined ||
        spotPrices?.allTimeHigh !== undefined ||
        spotPrices?.allTimeLow !== undefined ? (
          <>
            <Text variant={TextVariant.headingMd}>{t('marketDetails')}</Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={3}
            >
              {spotPrices?.marketCap === undefined
                ? undefined
                : renderRow('Market Cap', formatNumber(spotPrices.marketCap))}
              {/* TODO: doing 123.00 - dont need the decimals in that case.  Test MOG */}
              {spotPrices?.totalVolume === undefined
                ? undefined
                : renderRow(
                    'Total Volume',
                    formatNumber(spotPrices.totalVolume),
                  )}
              {spotPrices?.totalVolume !== undefined &&
              spotPrices.marketCap !== undefined
                ? renderRow(
                    'Volume / Market Cap',
                    (spotPrices.totalVolume / spotPrices.marketCap).toPrecision(
                      4,
                    ),
                  )
                : undefined}
              {spotPrices?.circulatingSupply === undefined
                ? undefined
                : renderRow(
                    'Circulating Supply',
                    formatNumber(spotPrices.circulatingSupply),
                  )}
              {spotPrices?.allTimeHigh === undefined
                ? undefined
                : renderRow(
                    'All time high',
                    formatCurrency(
                      spotPrices.allTimeHigh,
                      currency,
                      getPrecision(spotPrices.allTimeHigh),
                    ),
                  )}
              {spotPrices?.allTimeLow === undefined
                ? undefined
                : renderRow(
                    'All time low',
                    formatCurrency(
                      spotPrices.allTimeLow,
                      currency,
                      getPrecision(spotPrices.allTimeLow),
                    ),
                  )}
            </Box>
          </>
        ) : undefined}
        <Text variant={TextVariant.headingMd}>{t('yourActivity')}</Text>
        {/* TODO: Transaction history */}
      </Box>
    </Box>
  );
};

export default AssetV2;
