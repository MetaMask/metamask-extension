import React, { ReactNode } from 'react';
import { useHistory } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { EthMethod } from '@metamask/keyring-api';
import { isEqual } from 'lodash';
import BN from 'bn.js';
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import {
  getCurrentCurrency,
  getIsBridgeChain,
  getIsSwapsChain,
  getSelectedInternalAccount,
  getSwapsDefaultToken,
  getMarketData,
  getCurrencyRates,
  getSelectedAccountTokenBalancesAcrossChains,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
} from '../../../selectors';
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
import { AddressCopyButton } from '../../../components/multichain';
import { AssetType } from '../../../../shared/constants/transaction';
import TokenCell from '../../../components/app/assets/token-cell';
import TransactionList from '../../../components/app/transaction-list';
import { getPricePrecision, localizeLargeNumber } from '../util';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import CoinButtons from '../../../components/app/wallet-overview/coin-buttons';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import { stringifyBalance } from '../../../hooks/useTokenBalances';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import AssetChart from './chart/asset-chart';
import TokenButtons from './token-buttons';

/** Information about a native or token asset */
export type Asset = (
  | {
      type: AssetType.native;
      /** Whether the symbol has been verified to match the chain */
      isOriginalNativeSymbol: boolean;
      decimals: number;
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
  chainId: Hex;
  /** The asset's symbol, e.g. 'ETH' */
  symbol: string;
  /** The asset's name, e.g. 'Ethereum' */
  name?: string;
  /** A URL to the asset's image */
  image: string;
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
  const history = useHistory();
  const currency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);
  const account = useSelector(getSelectedInternalAccount, isEqual);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);

  const selectedAccountTokenBalancesAcrossChains: Record<string, any> =
    useSelector(getSelectedAccountTokenBalancesAcrossChains);
  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);

  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  const { chainId, type, symbol, name, image, decimals } = asset;

  // TODO: adding the addres here for native tokens would enable marketData/historic data
  const address =
    type === AssetType.token
      ? toChecksumHexAddress(asset.address)
      : zeroAddress();

  let balance;
  if (type === AssetType.native) {
    const nativeTokenBalanceHex = nativeBalances?.[chainId];
    if (nativeTokenBalanceHex && nativeTokenBalanceHex !== '0x0') {
      balance = stringifyBalance(
        new BN(hexToDecimal(nativeTokenBalanceHex)),
        new BN(18),
        5,
      );
    }
  } else {
    const hexBalance =
      selectedAccountTokenBalancesAcrossChains[chainId as Hex]?.[address];
    if (hexBalance && hexBalance !== '0x0') {
      balance = stringifyBalance(
        new BN(hexToDecimal(hexBalance)),
        new BN(decimals),
      );
    }
  }

  // Market and conversion rate data
  const baseCurrency = marketData[chainId]?.[address]?.currency;
  const tokenMarketPrice = marketData[chainId]?.[address]?.price || 0;
  const tokenExchangeRate = currencyRates[baseCurrency]?.conversionRate || 0;

  // Calculate fiat amount
  let tokenFiatAmount =
    tokenMarketPrice * tokenExchangeRate * parseFloat(String(balance));
  if (type === AssetType.native && currencyRates) {
    tokenFiatAmount =
      currencyRates[symbol]?.conversionRate * parseFloat(String(balance));
  }

  const currentPrice =
    tokenExchangeRate !== undefined && tokenMarketPrice !== undefined
      ? tokenExchangeRate * tokenMarketPrice
      : undefined;

  console.log(marketData[chainId]?.[address]);

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
          <Text data-testid="asset-name" color={TextColor.textAlternative}>
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
        currentPrice={currentPrice}
        currency={currency}
      />
      <Box marginTop={4}>
        {type === AssetType.native ? (
          <CoinButtons
            {...{
              trackingLocation: 'asset-page',
              isBuyableChain,
              isSigningEnabled,
              isSwapsChain,
              isBridgeChain,
              chainId,
              defaultSwapsToken,
            }}
          />
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
        <TokenCell
          key={`${symbol}-${address}`}
          address={address}
          chainId={chainId}
          symbol={symbol}
          image={image}
          balance={balance}
          tokenFiatAmount={tokenFiatAmount}
          string={balance?.toString()}
        />
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
          {conversionRate > 0 &&
            (marketData?.marketCap > 0 ||
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
                      <Text data-testid="asset-market-cap">
                        {localizeLargeNumber(
                          t,
                          conversionRate *
                            marketData[chainId]?.[address].marketCap,
                        )}
                      </Text>,
                    )}
                  {marketData?.totalVolume > 0 &&
                    renderRow(
                      t('totalVolume'),
                      <Text>
                        {localizeLargeNumber(
                          t,
                          conversionRate *
                            marketData[chainId]?.[address].totalVolume,
                        )}
                      </Text>,
                    )}
                  {marketData?.circulatingSupply > 0 &&
                    renderRow(
                      t('circulatingSupply'),
                      <Text>
                        {localizeLargeNumber(
                          t,
                          marketData[chainId]?.[address].circulatingSupply,
                        )}
                      </Text>,
                    )}
                  {marketData?.allTimeHigh > 0 &&
                    renderRow(
                      t('allTimeHigh'),
                      <Text>
                        {formatCurrency(
                          `${
                            conversionRate *
                            marketData[chainId]?.[address].allTimeHigh
                          }`,
                          currency,
                          getPricePrecision(
                            conversionRate *
                              marketData[chainId]?.[address].allTimeHigh,
                          ),
                        )}
                      </Text>,
                    )}
                  {marketData[chainId]?.[address]?.allTimeLow > 0 &&
                    renderRow(
                      t('allTimeLow'),
                      <Text>
                        {formatCurrency(
                          `${
                            conversionRate *
                            marketData[chainId]?.[address]?.allTimeLow
                          }`,
                          currency,
                          getPricePrecision(
                            conversionRate *
                              marketData[chainId]?.[address]?.allTimeLow,
                          ),
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
