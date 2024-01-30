import React, { useContext, useEffect, useState } from 'react';
import 'chartjs-adapter-moment';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ReactNode } from 'react-markdown';
import { getCurrentChainId, getCurrentCurrency } from '../../../selectors';
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
import { getPricePrecision, localizeLargeNumber } from './util';
import AssetChart from './asset-chart';

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
        <Text color={TextColor.textAlternative}>
          {name ? `${name} (${symbol})` : symbol}
        </Text>
      </Box>
      <AssetChart address={address} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
        paddingTop={9}
        gap={6}
        style={{ boxShadow: '0px -15px 15px -15px gray inset' }} // todo dark theme?
      >
        <Box>
          <Text variant={TextVariant.headingMd} paddingBottom={4}>
            {t('yourBalance')}
          </Text>
          <Box
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
              {/* <Text
                variant={TextVariant.bodyLgMedium}
                textAlign={TextAlign.Right}
              >
                $123
              </Text> */}
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
                textAlign={TextAlign.Right}
              >
                {balance} {symbol}
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
            {asset.decimals !== undefined &&
              renderRow(t('tokenDecimal'), <Text>{asset.decimals}</Text>)}
          </Box>
        )}
        {(spotPrices?.marketCap > 0 ||
          spotPrices?.totalVolume > 0 ||
          spotPrices?.circulatingSupply > 0 ||
          spotPrices?.allTimeHigh > 0 ||
          spotPrices?.allTimeLow > 0) && (
          <Box>
            <Text variant={TextVariant.headingMd} paddingBottom={4}>
              {t('marketDetails')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {spotPrices?.marketCap > 0 &&
                renderRow(
                  t('marketCap'),
                  <Text>{localizeLargeNumber(t, spotPrices.marketCap)}</Text>,
                )}
              {spotPrices?.totalVolume > 0 &&
                renderRow(
                  t('totalVolume'),
                  <Text>{localizeLargeNumber(t, spotPrices.totalVolume)}</Text>,
                )}
              {spotPrices?.totalVolume > 0 &&
                spotPrices?.marketCap > 0 &&
                renderRow(
                  `${t('volume')} / ${t('marketCap')}`,
                  <Text>
                    {(
                      spotPrices.totalVolume / spotPrices.marketCap
                    ).toPrecision(4)}
                  </Text>,
                )}
              {spotPrices?.circulatingSupply > 0 &&
                renderRow(
                  t('circulatingSupply'),
                  <Text>
                    {localizeLargeNumber(t, spotPrices.circulatingSupply)}
                  </Text>,
                )}
              {spotPrices?.allTimeHigh > 0 &&
                renderRow(
                  t('allTimeHigh'),
                  <Text>
                    {formatCurrency(
                      spotPrices.allTimeHigh,
                      currency,
                      getPricePrecision(spotPrices.allTimeHigh),
                    )}
                  </Text>,
                )}
              {spotPrices?.allTimeLow > 0 &&
                renderRow(
                  t('allTimeLow'),
                  <Text>
                    {formatCurrency(
                      spotPrices.allTimeLow,
                      currency,
                      getPricePrecision(spotPrices.allTimeLow),
                    )}
                  </Text>,
                )}
            </Box>
          </Box>
        )}
        <Text variant={TextVariant.headingMd}>{t('yourActivity')}</Text>
        {/* TODO: Transaction history */}
      </Box>
      <Box
        padding={4}
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{
          position: 'sticky',
          bottom: 0,
          boxShadow: 'lightgrey 0px 0px 12px 0px',
        }} // todo dark theme?
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
