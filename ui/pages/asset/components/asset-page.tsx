import React, { ReactNode, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { EthMethod } from '@metamask/keyring-api';
import { isEqual } from 'lodash';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import {
  getIsBridgeChain,
  getIsSwapsChain,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getSelectedInternalAccount,
  getSwapsDefaultToken,
  getMarketData,
  getCurrencyRates,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccount,
  getIsTestnet,
  getShowFiatInTestnets,
  getDataCollectionForMarketing,
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
  ButtonLink,
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
import {
  getConversionRate,
  getCurrentCurrency,
} from '../../../ducks/metamask/metamask';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import CoinButtons from '../../../components/app/wallet-overview/coin-buttons';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import { calculateTokenBalance } from '../../../components/app/assets/util/calculateTokenBalance';
import { useTokenBalances } from '../../../hooks/useTokenBalances';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainShouldShowFiat } from '../../../selectors/multichain';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
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
  balance?: { value: string; display: string; fiat: string };
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
  const selectedAccount = useSelector(getSelectedAccount);
  const currency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);

  const { chainId, type, symbol, name, image, decimals } = asset;

  // These need to be specific to the asset and not the current chain
  const defaultSwapsToken = useSelector(
    (state) => getSwapsDefaultToken(state, chainId),
    isEqual,
  );
  const isSwapsChain = useSelector((state) => getIsSwapsChain(state, chainId));
  const isBridgeChain = useSelector((state) =>
    getIsBridgeChain(state, chainId),
  );

  const account = useSelector(getSelectedInternalAccount, isEqual);
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);

  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);

  const isTestnet = useSelector(getIsTestnet);
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    selectedAccount,
  );
  const isMainnet = !isTestnet;
  // Check if show conversion is enabled
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  const { tokenBalances } = useTokenBalances();
  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address];

  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const metaMetricsId = useSelector(getMetaMetricsId);

  const address =
    type === AssetType.token
      ? toChecksumHexAddress(asset.address)
      : getNativeTokenAddress(chainId);

  const tokenHexBalance =
    selectedAccountTokenBalancesAcrossChains?.[chainId]?.[address as Hex];

  const balance = calculateTokenBalance({
    isNative: type === AssetType.native,
    chainId,
    address: address as Hex,
    decimals,
    nativeBalances,
    selectedAccountTokenBalancesAcrossChains,
  });

  // Market and conversion rate data
  const baseCurrency = marketData[chainId]?.[address]?.currency;
  const tokenMarketPrice = marketData[chainId]?.[address]?.price || 0;
  const tokenExchangeRate =
    type === AssetType.native
      ? currencyRates[symbol]?.conversionRate
      : currencyRates[baseCurrency]?.conversionRate || 0;

  // Calculate fiat amount
  const tokenFiatAmount =
    tokenMarketPrice * tokenExchangeRate * parseFloat(String(balance));

  const currentPrice =
    tokenExchangeRate !== undefined && tokenMarketPrice !== undefined
      ? tokenExchangeRate * tokenMarketPrice
      : undefined;

  const tokenMarketDetails = marketData[chainId]?.[address];
  const shouldDisplayMarketData =
    conversionRate > 0 &&
    tokenMarketDetails &&
    (tokenMarketDetails.marketCap > 0 ||
      tokenMarketDetails.totalVolume > 0 ||
      tokenMarketDetails.circulatingSupply > 0 ||
      tokenMarketDetails.allTimeHigh > 0 ||
      tokenMarketDetails.allTimeLow > 0);

  // this is needed in order to assign the correct balances to TokenButtons before navigating to send/swap screens

  asset.balance = {
    value: hexToDecimal(tokenHexBalance),
    display: String(balance),
    fiat: String(tokenFiatAmount),
  };
  const portfolioSpendingCapsUrl = useMemo(
    () =>
      getPortfolioUrl(
        '',
        'asset_page',
        metaMetricsId,
        isMetaMetricsEnabled,
        isMarketingEnabled,
        account.address,
        'spending-caps',
      ),
    [account.address, isMarketingEnabled, isMetaMetricsEnabled, metaMetricsId],
  );

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
              account,
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
          tokenFiatAmount={showFiat ? tokenFiatAmount : null}
          string={balance?.toString()}
        />
        <Box
          marginTop={2}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={7}
        >
          {[AssetType.token, AssetType.native].includes(type) && (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              paddingLeft={4}
              paddingRight={4}
            >
              <Text variant={TextVariant.headingMd} paddingBottom={4}>
                {t('tokenDetails')}
              </Text>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={2}
              >
                {type === AssetType.token && (
                  <Box>
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
                        renderRow(
                          t('tokenDecimal'),
                          <Text>{asset.decimals}</Text>,
                        )}
                      {asset.aggregators && asset.aggregators.length > 0 && (
                        <Box>
                          <Text
                            color={TextColor.textAlternative}
                            variant={TextVariant.bodyMdMedium}
                          >
                            {t('tokenList')}
                          </Text>
                          <Text>{asset.aggregators.join(', ')}</Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
                {renderRow(
                  t('spendingCaps'),
                  <ButtonLink
                    className="asset-page__spending-caps mm-text--body-md-medium"
                    href={portfolioSpendingCapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('editInPortfolio')}
                  </ButtonLink>,
                )}
              </Box>
            </Box>
          )}
          {shouldDisplayMarketData && (
            <Box paddingLeft={4} paddingRight={4}>
              <Text variant={TextVariant.headingMd} paddingBottom={4}>
                {t('marketDetails')}
              </Text>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={2}
              >
                {tokenMarketDetails.marketCap > 0 &&
                  renderRow(
                    t('marketCap'),
                    <Text data-testid="asset-market-cap">
                      {localizeLargeNumber(
                        t,
                        tokenExchangeRate * tokenMarketDetails.marketCap,
                      )}
                    </Text>,
                  )}
                {tokenMarketDetails.totalVolume > 0 &&
                  renderRow(
                    t('totalVolume'),
                    <Text>
                      {localizeLargeNumber(
                        t,
                        tokenExchangeRate * tokenMarketDetails.totalVolume,
                      )}
                    </Text>,
                  )}
                {tokenMarketDetails.circulatingSupply > 0 &&
                  renderRow(
                    t('circulatingSupply'),
                    <Text>
                      {localizeLargeNumber(
                        t,
                        tokenMarketDetails.circulatingSupply,
                      )}
                    </Text>,
                  )}
                {tokenMarketDetails.allTimeHigh > 0 &&
                  renderRow(
                    t('allTimeHigh'),
                    <Text>
                      {formatCurrency(
                        `${tokenExchangeRate * tokenMarketDetails.allTimeHigh}`,
                        currency,
                        getPricePrecision(
                          tokenExchangeRate * tokenMarketDetails.allTimeHigh,
                        ),
                      )}
                    </Text>,
                  )}
                {tokenMarketDetails.allTimeLow > 0 &&
                  renderRow(
                    t('allTimeLow'),
                    <Text>
                      {formatCurrency(
                        `${tokenExchangeRate * tokenMarketDetails.allTimeLow}`,
                        currency,
                        getPricePrecision(
                          tokenExchangeRate * tokenMarketDetails.allTimeLow,
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
              <TransactionList hideTokenTransactions tokenChainId={chainId} />
            ) : (
              <TransactionList tokenAddress={address} tokenChainId={chainId} />
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
