import React, { useEffect, useState, ReactNode } from 'react';
import { useHistory } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { getCurrentCurrency } from '../../../selectors';
import {
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AddressCopyButton,
  TokenListItem,
} from '../../../components/multichain';
import { AssetType } from '../../../../shared/constants/transaction';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { MINUTE } from '../../../../shared/constants/time';
import TokenCell from '../../../components/app/token-cell';
import TransactionList from '../../../components/app/transaction-list';
import {
  chainSupportsPricing,
  getPricePrecision,
  localizeLargeNumber,
} from '../util';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import EthButtons from '../../../components/app/wallet-overview/eth-buttons';
import AssetChart from './chart/asset-chart';
import TokenButtons from './token-buttons';

/** Information about a native or token asset */
export type Asset = (
  | {
      type: AssetType.native;
      /** Whether the symbol has been verified to match the chain */
      isOriginalNativeSymbol: boolean;
    }
  | {
      type: AssetType.token;
      /** The token's contract address */
      address: string;
      /** The number of decimal places to move left when displaying balances */
      decimals: number;
      /** An array of token list sources the asset appears in, e.g. [1inch,Sushiswap]  */
      aggregators?: [];
    }
) & {
  /** The hexadecimal chain id */
  chainId: `0x${string}`;
  /** The asset's symbol, e.g. 'ETH' */
  symbol: string;
  /** The asset's name, e.g. 'Ethereum' */
  name?: string;
  /** A URL to the asset's image */
  image: string;
  /** The current price of 1 unit of the asset, in the user's fiat currency */
  currentPrice?: number;
  balance: {
    /**
     * A decimal representation of the balance before applying
     * decimals e.g. '12300000000000000' for 0.0123 ETH
     */
    value: string;
    /**
     * A displayable representation of the balance after applying
     * decimals e.g. '0.0123' for 12300000000000000 WEI
     */
    display: string;
    /** The balance's localized value in fiat e.g. '$12.34' or '56,78 €' */
    fiat?: string;
  };
  /** True if the asset implements ERC721 */
  isERC721?: boolean;
};

// A page representing a native or token asset
const AssetPage = ({
  asset,
  optionsButton,
}: {
  asset: Asset;
  optionsButton: React.ReactNode;
}) => {
  const t = useI18nContext();

  const currency = useSelector(getCurrentCurrency);
  const history = useHistory();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [marketData, setMarketData] = useState<any>();
  const { chainId, type, symbol, name, image, balance } = asset;

  const address =
    type === AssetType.token
      ? asset.address
      : '0x0000000000000000000000000000000000000000';

  if (chainSupportsPricing(chainId)) {
    useEffect(() => {
      setMarketData(undefined);

      // TODO: Get this from https://github.com/MetaMask/core/pull/4206 once available
      fetchWithCache({
        url: `https://price-api.metafi.codefi.network/v2/chains/${chainId}/spot-prices/?includeMarketData=true&tokenAddresses=${address}&vsCurrency=${currency}`,
        cacheOptions: { cacheRefreshTime: 10 * MINUTE },
        functionName: 'GetAssetMarketData',
      })
        .catch(() => null)
        .then((data) => setMarketData(data?.[address.toLowerCase()]));
    }, [chainId, address, currency]);
  }

  return (
    <Box
      marginLeft="auto"
      marginRight="auto"
      marginTop={4}
      className="asset__content"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        paddingLeft={2}
        paddingRight={4}
        paddingBottom={1}
      >
        <Box display={Display.Flex}>
          <ButtonIcon
            color={IconColor.iconAlternative}
            marginRight={1}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
          <Text color={TextColor.textAlternative}>
            {name && symbol && name !== symbol
              ? `${name} (${symbol})`
              : name ?? symbol}
          </Text>
        </Box>
        {optionsButton}
      </Box>
      <AssetChart
        chainId={chainId}
        address={address}
        currentPrice={asset.currentPrice}
        currency={currency}
      />
      <Box marginTop={4}>
        {type === AssetType.native ? (
          <EthButtons />
        ) : (
          <TokenButtons token={asset} />
        )}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingTop={5}
      >
        <Text variant={TextVariant.headingMd} paddingBottom={2} paddingLeft={4}>
          {t('yourBalance')}
        </Text>
        {type === AssetType.native ? (
          <TokenListItem
            title={symbol}
            tokenSymbol={symbol}
            primary={`${balance.display} ${symbol}`}
            secondary={balance.fiat}
            tokenImage={image}
            isOriginalTokenSymbol={asset.isOriginalNativeSymbol}
            isNativeCurrency={true}
          />
        ) : (
          <TokenCell
            address={address}
            image={image}
            symbol={symbol}
            string={balance.display}
          />
        )}
        <Box
          marginTop={2}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={7}
        >
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
                      {t('tokenList')}
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
                    <Text>
                      {localizeLargeNumber(t, marketData.totalVolume)}
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
          <Box marginBottom={8}>
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
      </Box>
    </Box>
  );
};

function renderRow(leftColumn: string, rightColumn: ReactNode) {
  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
      >
        {leftColumn}
      </Text>
      {rightColumn}
    </Box>
  );
}

export default AssetPage;
