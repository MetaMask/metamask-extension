import React, { useEffect, useState } from 'react';
import 'chartjs-adapter-moment';
import { Token } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { P } from '@storybook/components/*';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getTokenList,
} from '../../../selectors';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
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
import TokenBalance from '../../../components/ui/token-balance';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { AddressCopyButton } from '../../../components/multichain';
import TokenChart from './token-chart';

const TokenAssetV2 = ({ token }: { token: Token }) => {
  const t = useI18nContext();

  // todo what if chain not supported?  how to determine?
  const chainId = hexToDecimal(useSelector(getCurrentChainId));

  // todo do we support all of these? fallback to something like usd?
  // can controller export list of supported?
  // see token rates controller
  const currency = useSelector(getCurrentCurrency);
  const tokenList = useSelector(getTokenList);

  // todo chain id?
  const tokenData = Object.values(tokenList).find(
    (listToken) =>
      listToken.symbol === token.symbol &&
      isEqualCaseInsensitive(listToken.address, token.address),
  );
  const name = tokenData?.name || token.symbol;
  const image = tokenData?.iconUrl;

  const { tokensWithBalances }: { tokensWithBalances: any[] } = useTokenTracker(
    { tokens: [token], address: undefined },
  );

  const tokenBalance = tokensWithBalances[0]?.string;
  const tokenCurrencyBalance = useTokenFiatAmount(
    token.address,
    tokenBalance,
    token.symbol,
    {},
    false,
  );

  console.log(tokenCurrencyBalance)
  console.log(tokenCurrencyBalance)
  console.log(tokenCurrencyBalance)
  console.log(tokenCurrencyBalance)
  console.log(tokenCurrencyBalance)

  const [spotPrices, setSpotPrices] = useState<any>(); // todo better type?

  // todo canonicalize address?  is that necessary?
  // cache these when clicking between???? for a limited amount of time?

  // todo handle 404?
  useEffect(() => {
    setSpotPrices(undefined);
    fetch(
      `https://price-api.metafi-dev.codefi.network/v2/chains/${chainId}/spot-prices/?tokenAddresses=${token.address}&vsCurrency=${currency}&includeMarketData=true`,
    )
      // todo canonicalize address anywhere?
      .then((resp) => (resp.status === 200 ? resp.json() : null))
      .then((data) => setSpotPrices(data?.[token.address.toLowerCase()]));
  }, [chainId, token.address, currency]);

  console.log(spotPrices);

  return (
    <Box>
      <Box padding={4} paddingBottom={0}>
        <Text>
          {name} ({token.symbol})
        </Text>
        <Text variant={TextVariant.headingLg}>
          {spotPrices?.price ? formatCurrency(spotPrices.price, currency) : ''}
        </Text>
      </Box>
      <TokenChart token={token} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
        paddingTop={7}
        gap={5}
      >
        <Text variant={TextVariant.headingMd}>{t('yourBalance')}</Text>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <AvatarToken src={image} size={AvatarTokenSize.Md} />
            <Text paddingLeft={3} variant={TextVariant.bodyMdBold}>{name}</Text>
          </Box>
          <Box>
            <Text variant={TextVariant.bodyMdBold}> {tokenCurrencyBalance}</Text>
            <TokenBalance
              showFiat={false}
              className={undefined}
              textProps={
                {
                  // color: ,
                  // variant: TextVariant.bodyMdBold,
                }

              }
              suffixProps={
                {
                  // color: ,
                  // variant: TextVariant.bodyMdBold,
                }
              }
              token={token}
              // wraps weird for long 0.0123341343345 amounts (and maybe symbols too?)
              // flexWrap={FlexWrap.NoWrap}
            />

          </Box>
        </Box>
        <Box display={Display.Flex} gap={4}>
          <ButtonSecondary padding={5} width={BlockSize.Full}>
            {t('bridge')}
          </ButtonSecondary>
          <ButtonSecondary padding={5} width={BlockSize.Full}>
            {t('send')}
          </ButtonSecondary>
        </Box>
        <Text variant={TextVariant.headingMd}>{t('tokenDetails')}</Text>
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text>{t('contractAddress')}</Text>
            <AddressCopyButton address={token.address} shorten />
          </Box>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text>Token Decimal</Text>
            <Text>{token.decimals}</Text>
          </Box>
        </Box>
        {spotPrices?.marketCap !== undefined ||
        spotPrices?.totalVolume !== undefined ||
        spotPrices?.circulatingSupply !== undefined ||
        spotPrices?.allTimeHigh !== undefined ||
        spotPrices?.allTimeLow !== undefined ? (
          <>
            <Text variant={TextVariant.headingMd}>{t('marketDetails')}</Text>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              {spotPrices?.marketCap !== undefined
                ? renderRow('Market Cap', formatNumber(spotPrices.marketCap))
                : undefined}
                {/* TODO: doing 123.00 - dont need the decimals in that case.  Test MOG */}
              {spotPrices?.totalVolume !== undefined
                ? renderRow(
                    'Total Volume',
                    formatNumber(spotPrices.totalVolume),
                  )
                : undefined}
              {spotPrices?.totalVolume !== undefined && spotPrices.marketCap  !== undefined
                ? renderRow(
                    'Volume / Market Cap',
                    (spotPrices.totalVolume / spotPrices.marketCap).toPrecision(
                      4,
                    ),
                  )
                : undefined}
              {spotPrices?.circulatingSupply !== undefined
                ? renderRow(
                    'Circulating Supply',
                    formatNumber(spotPrices.circulatingSupply),
                  )
                : undefined}
                {/* // TODO these are 0 cuz really small units??? try $MOG */}
              {spotPrices?.allTimeHigh !== undefined
                ? renderRow(
                    'All time high',
                    formatCurrency(spotPrices.allTimeHigh, currency),
                  )
                : undefined}
              {spotPrices?.allTimeLow !== undefined
                ? renderRow(
                    'Market Cap',
                    formatCurrency(spotPrices.allTimeLow, currency),
                  )
                : undefined}
            </Box>
          </>
        ) : undefined}
        <Text variant={TextVariant.headingMd}>{t('yourActivity')}</Text>
      </Box>
    </Box>
  );
};

const renderRow = (leftColumn: string, rightColumn: string) => (
  <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
    <Text>{leftColumn}</Text>
    <Text>{rightColumn}</Text>
  </Box>
);

const formatNumber = (number: number) =>
  number >= 1000000000000
    ? `${(number / 1000000000000).toFixed(2)}T`
    : number >= 1000000000
    ? `${(number / 1000000000).toFixed(2)}B`
    : number >= 1000000
    ? `${(number / 1000000).toFixed(2)}M`
    : number.toFixed(2);

export default TokenAssetV2;
