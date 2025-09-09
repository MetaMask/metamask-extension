import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { BtcMethod, EthMethod, SolMethod } from '@metamask/keyring-api';
import {
  type CaipAssetType,
  type Hex,
  isCaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AssetType } from '../../../../shared/constants/transaction';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import useMultiChainAssets from '../../../components/app/assets/hooks/useMultichainAssets';
import TokenCell from '../../../components/app/assets/token-cell';
import { calculateTokenBalance } from '../../../components/app/assets/util/calculateTokenBalance';
import TransactionList from '../../../components/app/transaction-list';
import CoinButtons from '../../../components/app/wallet-overview/coin-buttons';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
  Text,
} from '../../../components/component-library';
import { AddressCopyButton } from '../../../components/multichain';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { useTokenBalances } from '../../../hooks/useTokenBalances';
import {
  getDataCollectionForMarketing,
  getIsBridgeChain,
  getIsMultichainAccountsState2Enabled,
  getIsSwapsChain,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getShowFiatInTestnets,
} from '../../../selectors';
import {
  getImageForChainId,
  getMultichainIsTestnet,
  getMultichainNetworkConfigurationsByChainId,
  getMultichainShouldShowFiat,
} from '../../../selectors/multichain';
import {
  TokenFiatDisplayInfo,
  type TokenWithFiatAmount,
} from '../../../components/app/assets/types';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { useSafeChains } from '../../settings/networks-tab/networks-form/use-safe-chains';
import { Asset } from '../types/asset';
import { useCurrentPrice } from '../hooks/useCurrentPrice';
import {
  getAssetsBySelectedAccountGroup,
  getMultichainNativeAssetType,
} from '../../../selectors/assets';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import AssetChart from './chart/asset-chart';
import TokenButtons from './token-buttons';
import { AssetMarketDetails } from './asset-market-details';

// TODO BIP44 Refactor: This page needs a significant refactor after BIP44 is enabled to remove confusing branching logic
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
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const isEvm = isEvmChainId(asset.chainId);
  const nativeAssetType = useSelector(getMultichainNativeAssetType);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const accountGroupIdAssets = useSelector(getAssetsBySelectedAccountGroup);
  const caipChainId = isCaipChainId(asset.chainId)
    ? asset.chainId
    : formatChainIdToCaip(asset.chainId);
  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  ) as InternalAccount;

  useEffect(() => {
    endTrace({ name: TraceName.AssetDetails });
  }, []);

  const { chainId, type, symbol, name, image, decimals } = asset;

  const isNative = type === AssetType.native;

  const isSwapsChain = useSelector((state) => getIsSwapsChain(state, chainId));
  const isBridgeChain = useSelector((state) =>
    getIsBridgeChain(state, chainId),
  );

  const isSigningEnabled =
    selectedAccount.methods.includes(EthMethod.SignTransaction) ||
    selectedAccount.methods.includes(EthMethod.SignUserOperation) ||
    selectedAccount.methods.includes(SolMethod.SignTransaction) ||
    selectedAccount.methods.includes(BtcMethod.SignPsbt);

  const isTestnet = useMultichainSelector(getMultichainIsTestnet);
  const shouldShowFiat = useMultichainSelector(getMultichainShouldShowFiat);
  const isMainnet = !isTestnet;
  // Check if show conversion is enabled
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  const { tokenBalances } = useTokenBalances({ chainIds: [chainId] });

  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address as Hex];

  const multiChainAssets = useMultiChainAssets();
  const mutichainTokenWithFiatAmount = multiChainAssets
    .filter((item) => item.chainId === chainId && item.address !== undefined)
    .find((item) => {
      switch (type) {
        case AssetType.native:
          return item.isNative;
        case AssetType.token:
          return item.address === asset.address;
        default:
          return false;
      }
    }) ?? {
    // TODO: remve the fallback case where the mutichainTokenWithFiatAmount is undefined
    // Root cause: There is a race condition where when switching from a non-EVM network
    // to an EVM network, the mutichainTokenWithFiatAmount is undefined
    // This is a workaround to avoid the error
    // Look into the isEvm selector
    // We might be switching network before account.
    address: '',
    chainId: '',
    symbol: '',
    title: '',
    image: '',
    tokenFiatAmount: 0,
    string: '',
    decimals: 0,
    aggregators: [],
    isNative: false,
    primary: '',
    secondary: 0,
  };

  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const metaMetricsId = useSelector(getMetaMetricsId);

  let address =
    (() => {
      if (type === AssetType.token) {
        return isEvm ? toChecksumHexAddress(asset.address) : asset.address;
      }
      return isEvm ? getNativeTokenAddress(chainId) : nativeAssetType;
    })() ?? '';

  const shouldShowContractAddress = type === AssetType.token;
  const contractAddress = (() => {
    if (shouldShowContractAddress) {
      return isEvm
        ? toChecksumHexAddress(asset.address)
        : parseCaipAssetType(address as CaipAssetType).assetReference;
    }
    return '';
  })();

  const { currentPrice } = useCurrentPrice(asset);

  let balance, tokenFiatAmount, assetId;
  if (isMultichainAccountsState2Enabled) {
    const assetWithBalance = accountGroupIdAssets[chainId]?.find(
      (item) =>
        item.assetId.toLowerCase() === address.toLowerCase() ||
        // TODO: This is a workaround for non-evm native assets, as the address that is received here is blank
        (!address && !isEvm && item.isNative),
    );

    assetId = assetWithBalance?.assetId;
    address = assetWithBalance?.assetId as string;
    balance = assetWithBalance?.balance as string;
    tokenFiatAmount = assetWithBalance?.fiat?.balance as number;
    const tokenHexBalance = assetWithBalance?.rawBalance as string;

    asset.balance = {
      value: hexToDecimal(tokenHexBalance),
      display: balance,
      fiat: String(tokenFiatAmount),
    };
  } else {
    const tokenHexBalance =
      selectedAccountTokenBalancesAcrossChains?.[chainId]?.[address as Hex];

    balance = calculateTokenBalance({
      isNative,
      chainId,
      address: address as Hex,
      decimals,
      nativeBalances,
      selectedAccountTokenBalancesAcrossChains,
    });

    tokenFiatAmount = currentPrice
      ? currentPrice * parseFloat(String(balance))
      : 0;

    // this is needed in order to assign the correct balances to TokenButtons before navigating to send/swap screens
    asset.balance = {
      value: hexToDecimal(tokenHexBalance),
      display: String(balance),
      fiat: String(tokenFiatAmount),
    };
  }

  const shouldShowSpendingCaps = isEvm;
  const portfolioSpendingCapsUrl = useMemo(
    () =>
      getPortfolioUrl(
        '',
        'asset_page',
        metaMetricsId,
        isMetaMetricsEnabled,
        isMarketingEnabled,
        selectedAccount.address,
        'spending-caps',
      ),
    [
      selectedAccount.address,
      isMarketingEnabled,
      isMetaMetricsEnabled,
      metaMetricsId,
    ],
  );

  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const networkName = networkConfigurationsByChainId[chainId]?.name;
  const tokenChainImage = getImageForChainId(chainId);

  const tokenWithFiatAmount =
    isEvm || isMultichainAccountsState2Enabled
      ? {
          address: isEvm ? address : assetId,
          chainId,
          symbol,
          image,
          title: name ?? symbol,
          tokenFiatAmount: showFiat ? tokenFiatAmount : null,
          string: balance ? balance.toString() : '',
          decimals: asset.decimals,
          aggregators:
            type === AssetType.token && asset.aggregators
              ? asset.aggregators
              : [],
          isNative: type === AssetType.native,
          primary: balance ? balance.toString() : '',
          secondary: balance ? Number(balance) : 0,
        }
      : (mutichainTokenWithFiatAmount as TokenWithFiatAmount);

  const { safeChains } = useSafeChains();

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
        paddingTop={1}
        paddingBottom={3}
        paddingLeft={2}
        paddingRight={4}
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
        </Box>
        {optionsButton}
      </Box>
      <Box paddingLeft={4}>
        <Text
          data-testid="asset-name"
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
        >
          {name && symbol && name !== symbol
            ? `${name} (${symbol})`
            : (name ?? symbol)}
        </Text>
      </Box>
      <AssetChart
        chainId={chainId}
        address={address}
        currentPrice={currentPrice}
        currency={currency}
        asset={tokenWithFiatAmount as TokenFiatDisplayInfo}
      />
      <Box marginTop={4} paddingLeft={4} paddingRight={4}>
        {type === AssetType.native ? (
          <CoinButtons
            {...{
              account: selectedAccount,
              trackingLocation: 'asset-page',
              isBuyableChain,
              isSigningEnabled,
              isSwapsChain,
              isBridgeChain,
              chainId,
            }}
          />
        ) : (
          <TokenButtons token={asset} account={selectedAccount} />
        )}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingTop={3}
      >
        <Text
          variant={TextVariant.headingSm}
          paddingBottom={1}
          paddingTop={1}
          paddingLeft={4}
        >
          {t('yourBalance')}
        </Text>
        {[AssetType.token, AssetType.native].includes(type) && (
          <TokenCell
            key={`${symbol}-${address}`}
            token={tokenWithFiatAmount as TokenWithFiatAmount}
            disableHover={true}
            safeChains={safeChains}
          />
        )}
        <Box
          marginTop={2}
          marginBottom={2}
          borderColor={BorderColor.borderMuted}
          marginInline={4}
          style={{ height: '1px', borderBottomWidth: 0 }}
        ></Box>
        <Box
          marginTop={2}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
        >
          {[AssetType.token, AssetType.native].includes(type) && (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              paddingLeft={4}
              paddingRight={4}
            >
              <Text variant={TextVariant.headingSm} paddingBottom={2}>
                {t('tokenDetails')}
              </Text>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={2}
              >
                {renderRow(
                  t('network'),
                  <Text
                    variant={TextVariant.bodyMdMedium}
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    gap={2}
                    data-testid="asset-network"
                  >
                    <AvatarNetwork
                      src={tokenChainImage}
                      name={networkName}
                      size={AvatarNetworkSize.Xs}
                    />
                    {networkName}
                  </Text>,
                )}
                {shouldShowContractAddress && (
                  <Box>
                    {renderRow(
                      t('contractAddress'),
                      <AddressCopyButton address={contractAddress} shorten />,
                    )}
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      gap={2}
                    >
                      {asset.decimals !== undefined &&
                        renderRow(
                          t('tokenDecimal'),
                          <Text variant={TextVariant.bodyMdMedium}>
                            {asset.decimals}
                          </Text>,
                        )}
                      {asset.aggregators && asset.aggregators.length > 0 && (
                        <Box>
                          <Text
                            variant={TextVariant.bodyMdMedium}
                            color={TextColor.textAlternative}
                          >
                            {t('tokenList')}
                          </Text>
                          <Text variant={TextVariant.bodyMdMedium}>
                            {asset.aggregators
                              .map((agg) =>
                                agg.replace(/^metamask$/iu, 'MetaMask'),
                              )
                              .join(', ')}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
                {shouldShowSpendingCaps &&
                  renderRow(
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
          <AssetMarketDetails asset={asset} address={address} />
          <Box
            borderColor={BorderColor.borderMuted}
            marginInline={4}
            style={{ height: '1px', borderBottomWidth: 0 }}
          ></Box>
          <Box marginBottom={4}>
            <Text paddingInline={4} variant={TextVariant.headingSm}>
              {t('yourActivity')}
            </Text>
            {type === AssetType.native ? (
              <TransactionList
                tokenAddress={address}
                hideNetworkFilter
                overrideFilterForCurrentChain={true}
              />
            ) : (
              <TransactionList tokenAddress={address} hideNetworkFilter />
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
      <Text variant={TextVariant.bodyMdMedium}>{rightColumn}</Text>
    </Box>
  );
}

export default AssetPage;
