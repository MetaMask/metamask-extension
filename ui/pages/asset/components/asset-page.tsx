import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  BtcMethod,
  EthMethod,
  SolMethod,
  TrxAccountType,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  type CaipAssetType,
  type Hex,
  isCaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AssetType } from '../../../../shared/constants/transaction';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import useMultiChainAssets from '../../../components/app/assets/hooks/useMultichainAssets';
import TokenCell from '../../../components/app/assets/token-cell';
import {
  TokenFiatDisplayInfo,
  type TokenWithFiatAmount,
} from '../../../components/app/assets/types';
import { calculateTokenBalance } from '../../../components/app/assets/util/calculateTokenBalance';
import TransactionList from '../../../components/app/transaction-list';
import UnifiedTransactionList from '../../../components/app/transaction-list/unified-transaction-list.component';
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
  BorderColor,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
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
  getAsset,
  getAssetsBySelectedAccountGroup,
  getMultichainNativeAssetType,
} from '../../../selectors/assets';
import {
  getImageForChainId,
  getMultichainIsTestnet,
  getMultichainNetworkConfigurationsByChainId,
  getMultichainShouldShowFiat,
  getMultichainIsTron,
} from '../../../selectors/multichain';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { useSafeChains } from '../../settings/networks-tab/networks-form/use-safe-chains';
import { useCurrentPrice } from '../hooks/useCurrentPrice';
import { isNativeAsset, type Asset } from '../types/asset';
import { AssetMarketDetails } from './asset-market-details';
import AssetChart from './chart/asset-chart';
import TokenButtons from './token-buttons';
import { TronDailyResources } from './tron-daily-resources';

/**
 * Props for TokenBalanceDisplay component
 */
type TokenBalanceDisplayProps = {
  asset: Asset;
  tokenWithFiatAmount: TokenWithFiatAmount;
  safeChains: ReturnType<typeof useSafeChains>['safeChains'];
  symbol: string;
  address: string;
};

/**
 * Renders the token balance cell. Extracted to share between
 * TokenBalanceSection and the BIP44-enabled path.
 * Note: AssetMarketDetails is rendered separately to preserve DOM order.
 */
// Note: React Compiler handles memoization for same-file components
const TokenBalanceDisplay = ({
  asset,
  tokenWithFiatAmount,
  safeChains,
  symbol,
  address,
}: TokenBalanceDisplayProps) => {
  const { type } = asset;

  return (
    <>
      {[AssetType.token, AssetType.native].includes(type) && (
        <TokenCell
          key={`${symbol}-${address}`}
          token={tokenWithFiatAmount}
          safeChains={safeChains}
        />
      )}
    </>
  );
};

/**
 * Props for the TokenBalanceSection component
 */
type TokenBalanceSectionProps = {
  asset: Asset;
  chainId: Hex;
  address: string;
  selectedAccount: InternalAccount;
  nativeBalances: Record<Hex, Hex>;
  isNative: boolean;
  decimals: number;
  currentPrice: number | null | undefined;
  showFiat: boolean;
  symbol: string;
  name: string | undefined;
  image: string | undefined;
  aggregators: string[] | undefined;
  accountType: string | undefined;
  safeChains: ReturnType<typeof useSafeChains>['safeChains'];
};

/**
 * Isolated component that subscribes to useTokenBalances.
 * This prevents the parent AssetPage from re-rendering when token balances update.
 */
// Note: React Compiler handles memoization for same-file components
const TokenBalanceSection = ({
  asset,
  chainId,
  address,
  selectedAccount,
  nativeBalances,
  isNative,
  decimals,
  currentPrice,
  showFiat,
  symbol,
  name,
  image,
  aggregators,
  accountType,
  safeChains,
}: TokenBalanceSectionProps) => {
  // This hook subscription is now isolated to this component
  const { tokenBalances } = useTokenBalances({ chainIds: [chainId] });

  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address as Hex];

  const balance = calculateTokenBalance({
    isNative,
    chainId,
    address: address as Hex,
    decimals,
    nativeBalances,
    selectedAccountTokenBalancesAcrossChains,
  });

  const tokenFiatAmount = currentPrice
    ? currentPrice * parseFloat(String(balance))
    : 0;

  const tokenWithFiatAmount: TokenWithFiatAmount = {
    address: address as Hex,
    chainId,
    symbol,
    image: image ?? '',
    title: name ?? symbol,
    tokenFiatAmount: showFiat ? tokenFiatAmount : null,
    string: balance ? balance.toString() : '',
    decimals,
    aggregators:
      asset.type === AssetType.token && aggregators ? aggregators : [],
    isNative: asset.type === AssetType.native,
    balance,
    secondary: balance ? Number(balance) : 0,
    accountType: accountType as TokenWithFiatAmount['accountType'],
  };

  return (
    <TokenBalanceDisplay
      asset={asset}
      tokenWithFiatAmount={tokenWithFiatAmount}
      safeChains={safeChains}
      symbol={symbol}
      address={address}
    />
  );
};

/**
 * Props for AssetButtonsSection component
 */
type AssetButtonsSectionProps = {
  asset: Asset;
  chainId: Hex;
  address: string;
  selectedAccount: InternalAccount;
  nativeBalances: Record<Hex, Hex>;
  isNative: boolean;
  decimals: number;
  currentPrice: number | null | undefined;
  isBuyableChain: boolean;
  isSigningEnabled: boolean;
  isSwapsChain: boolean;
  isBridgeChain: boolean;
};

/**
 * Isolated component for action buttons that subscribes to useTokenBalances.
 * This prevents the parent AssetPage from re-rendering when token balances update.
 */
// Note: React Compiler handles memoization for same-file components
const AssetButtonsSection = ({
  asset,
  chainId,
  address,
  selectedAccount,
  nativeBalances,
  isNative,
  decimals,
  currentPrice,
  isBuyableChain,
  isSigningEnabled,
  isSwapsChain,
  isBridgeChain,
}: AssetButtonsSectionProps) => {
  // This hook subscription is now isolated to this component
  const { tokenBalances } = useTokenBalances({ chainIds: [chainId] });

  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address as Hex];

  const tokenHexBalance =
    selectedAccountTokenBalancesAcrossChains?.[chainId]?.[address as Hex];

  const balance = calculateTokenBalance({
    isNative,
    chainId,
    address: address as Hex,
    decimals,
    nativeBalances,
    selectedAccountTokenBalancesAcrossChains,
  });

  const tokenFiatAmount = currentPrice
    ? currentPrice * parseFloat(String(balance))
    : 0;

  const updatedAsset = {
    ...asset,
    balance: {
      value: hexToDecimal(tokenHexBalance),
      display: String(balance),
      fiat: String(tokenFiatAmount),
    },
  };

  return (
    <Box marginTop={4} paddingLeft={4} paddingRight={4}>
      {isNativeAsset(updatedAsset) ? (
        <CoinButtons
          {...{
            account: selectedAccount,
            trackingLocation: 'asset-page',
            isBuyableChain,
            isSigningEnabled,
            isSwapsChain,
            isBridgeChain,
            chainId,
            disableSendForNonEvm: true,
          }}
        />
      ) : (
        <TokenButtons
          token={updatedAsset}
          account={selectedAccount}
          disableSendForNonEvm
        />
      )}
    </Box>
  );
};

/**
 * Props for AssetMarketDetailsSection component
 */
type AssetMarketDetailsSectionProps = {
  asset: Asset;
  chainId: Hex;
  address: string;
  selectedAccount: InternalAccount;
  nativeBalances: Record<Hex, Hex>;
  isNative: boolean;
  decimals: number;
  currentPrice: number | null | undefined;
};

// Isolated component for market details that subscribes to useTokenBalances.
// This prevents the parent AssetPage from re-rendering when token balances update.
const AssetMarketDetailsSection = ({
  asset,
  chainId,
  address,
  selectedAccount,
  nativeBalances,
  isNative,
  decimals,
  currentPrice,
}: AssetMarketDetailsSectionProps) => {
  // This hook subscription is now isolated to this component
  const { tokenBalances } = useTokenBalances({ chainIds: [chainId] });

  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address as Hex];

  const tokenHexBalance =
    selectedAccountTokenBalancesAcrossChains?.[chainId]?.[address as Hex];

  const balance = calculateTokenBalance({
    isNative,
    chainId,
    address: address as Hex,
    decimals,
    nativeBalances,
    selectedAccountTokenBalancesAcrossChains,
  });

  const tokenFiatAmount = currentPrice
    ? currentPrice * parseFloat(String(balance))
    : 0;

  const updatedAsset = {
    ...asset,
    balance: {
      value: hexToDecimal(tokenHexBalance),
      display: String(balance),
      fiat: String(tokenFiatAmount),
    },
  };

  return <AssetMarketDetails asset={updatedAsset} address={address} />;
};

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
  const navigate = useNavigate();
  const currency = useSelector(getCurrentCurrency);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const isEvm = isEvmChainId(asset.chainId);
  // TODO BIP44 Refactor: This selector does not work with BIP44 enabled, pass the information in the asset object
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
    selectedAccount.methods.includes(BtcMethod.SignPsbt) ||
    selectedAccount.type === TrxAccountType.Eoa;

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

  // NOTE: useTokenBalances is now called in isolated child components (TokenBalanceSection, AssetButtonsSection)
  // to prevent re-renders of the entire AssetPage when token balances poll/update.

  const multiChainAssets = useMultiChainAssets();
  const mutichainTokenWithFiatAmount = useMemo(
    () =>
      multiChainAssets
        .filter(
          (item) => item.chainId === chainId && item.address !== undefined,
        )
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
        // TODO: remove the fallback case where the mutichainTokenWithFiatAmount is undefined
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
        balance: 0,
        secondary: 0,
      },
    [multiChainAssets, chainId, type, asset],
  );

  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const metaMetricsId = useSelector(getMetaMetricsId);

  // Calculate address - used for both BIP44 enabled and disabled paths
  const baseAddress = useMemo(() => {
    if (type === AssetType.token) {
      return isEvm ? toChecksumHexAddress(asset.address) : asset.address;
    }
    return isEvm ? getNativeTokenAddress(chainId) : nativeAssetType;
  }, [type, isEvm, asset, chainId, nativeAssetType]);

  // For BIP44 enabled, we need to look up the asset to get the correct address/assetId
  const bip44AssetData = useMemo(() => {
    if (!isMultichainAccountsState2Enabled) {
      return null;
    }
    const assetWithBalance = accountGroupIdAssets[chainId]?.find(
      (item) =>
        item.assetId.toLowerCase() === (baseAddress ?? '').toLowerCase() ||
        // TODO: This is a workaround for non-evm native assets, as the address that is received here is blank
        (!baseAddress && !isEvm && item.isNative),
    );
    return assetWithBalance ?? null;
  }, [
    isMultichainAccountsState2Enabled,
    accountGroupIdAssets,
    chainId,
    baseAddress,
    isEvm,
  ]);

  // Final address used throughout the component
  const address = isMultichainAccountsState2Enabled
    ? bip44AssetData?.assetId || baseAddress || ''
    : baseAddress || '';

  const shouldShowContractAddress = type === AssetType.token;
  const contractAddress = useMemo(() => {
    if (shouldShowContractAddress) {
      return isEvm
        ? toChecksumHexAddress(asset.address)
        : parseCaipAssetType(address as CaipAssetType).assetReference;
    }
    return '';
  }, [shouldShowContractAddress, isEvm, asset, address]);

  const { currentPrice } = useCurrentPrice(asset);

  // Calculate balance and updatedAsset for BIP44-enabled path (uses selector data, not useTokenBalances)
  const bip44BalanceData = useMemo(() => {
    if (!isMultichainAccountsState2Enabled || !bip44AssetData) {
      return null;
    }
    const balance = bip44AssetData.balance ?? '0';
    const tokenFiatAmount = bip44AssetData.fiat?.balance ?? 0;
    const tokenHexBalance = bip44AssetData.rawBalance as string;

    const updatedAsset = {
      ...asset,
      balance: {
        value: hexToDecimal(tokenHexBalance),
        display: balance,
        fiat: String(tokenFiatAmount),
      },
    };

    return { balance, tokenFiatAmount, updatedAsset };
  }, [isMultichainAccountsState2Enabled, bip44AssetData, asset]);

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

  const bip44Asset = useSelector((state) => getAsset(state, address, chainId));

  // tokenWithFiatAmount for BIP44-enabled path and non-EVM assets
  const tokenWithFiatAmount = useMemo(() => {
    if (isEvm || isMultichainAccountsState2Enabled) {
      const balance = bip44BalanceData?.balance ?? '0';
      const tokenFiatAmount = bip44BalanceData?.tokenFiatAmount ?? 0;
      return {
        address: isEvm ? address : (bip44AssetData?.assetId ?? ''),
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
        balance,
        secondary: balance ? Number(balance) : 0,
        accountType: bip44Asset?.accountType,
      };
    }
    return {
      ...mutichainTokenWithFiatAmount,
      accountType: bip44Asset?.accountType,
    };
  }, [
    isEvm,
    isMultichainAccountsState2Enabled,
    bip44BalanceData,
    bip44AssetData,
    address,
    chainId,
    symbol,
    image,
    name,
    showFiat,
    asset,
    type,
    bip44Asset,
    mutichainTokenWithFiatAmount,
  ]);

  const { safeChains } = useSafeChains();

  const isBIP44FeatureFlagEnabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const showUnifiedTransactionList = isBIP44FeatureFlagEnabled;

  // Check if we should show Tron resources
  const isTron = useMultichainSelector(getMultichainIsTron, selectedAccount);
  const showTronResources = isTron && type === AssetType.native;

  return (
    <Box className="asset__content">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        paddingBottom={3}
        paddingLeft={2}
        paddingRight={4}
        className="pt-4 sticky top-0 z-10 bg-background-default"
      >
        <Box display={Display.Flex}>
          <ButtonIcon
            color={IconColor.iconAlternative}
            marginRight={1}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(DEFAULT_ROUTE)}
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
      {/* Action buttons - isolated to prevent re-renders from balance polling */}
      {isMultichainAccountsState2Enabled && bip44BalanceData ? (
        <Box marginTop={4} paddingLeft={4} paddingRight={4}>
          {isNativeAsset(bip44BalanceData.updatedAsset) ? (
            <CoinButtons
              {...{
                account: selectedAccount,
                trackingLocation: 'asset-page',
                isBuyableChain,
                isSigningEnabled,
                isSwapsChain,
                isBridgeChain,
                chainId,
                disableSendForNonEvm: true,
              }}
            />
          ) : (
            <TokenButtons
              token={bip44BalanceData.updatedAsset}
              account={selectedAccount}
              disableSendForNonEvm
            />
          )}
        </Box>
      ) : (
        <AssetButtonsSection
          asset={asset}
          chainId={chainId}
          address={address}
          selectedAccount={selectedAccount}
          nativeBalances={nativeBalances}
          isNative={isNative}
          decimals={decimals}
          currentPrice={currentPrice}
          isBuyableChain={isBuyableChain}
          isSigningEnabled={isSigningEnabled}
          isSwapsChain={isSwapsChain}
          isBridgeChain={isBridgeChain}
        />
      )}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingTop={3}
      >
        {showTronResources && (
          <Box>
            <TronDailyResources account={selectedAccount} chainId={chainId} />
            <Box
              marginTop={2}
              marginBottom={2}
              borderColor={BorderColor.borderMuted}
              marginInline={4}
              style={{ height: '1px', borderBottomWidth: 0 }}
            />
          </Box>
        )}
        <Text
          variant={TextVariant.headingSm}
          paddingBottom={1}
          paddingTop={1}
          paddingLeft={4}
        >
          {t('yourBalance')}
        </Text>
        {/* Balance display - isolated to prevent re-renders from balance polling */}
        {isMultichainAccountsState2Enabled && bip44BalanceData ? (
          <TokenBalanceDisplay
            asset={asset}
            tokenWithFiatAmount={tokenWithFiatAmount as TokenWithFiatAmount}
            safeChains={safeChains}
            symbol={symbol}
            address={address}
          />
        ) : (
          <TokenBalanceSection
            asset={asset}
            chainId={chainId}
            address={address}
            selectedAccount={selectedAccount}
            nativeBalances={nativeBalances}
            isNative={isNative}
            decimals={decimals}
            currentPrice={currentPrice}
            showFiat={showFiat}
            symbol={symbol}
            name={name}
            image={image}
            aggregators={
              asset.type === AssetType.token ? asset.aggregators : undefined
            }
            accountType={bip44Asset?.accountType}
            safeChains={safeChains}
          />
        )}
        <Box
          marginTop={2}
          marginBottom={2}
          borderColor={BorderColor.borderMuted}
          marginInline={4}
          style={{ height: '1px', borderBottomWidth: 0 }}
        />
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
          {/* Market details - isolated to prevent re-renders from balance polling */}
          {isMultichainAccountsState2Enabled && bip44BalanceData ? (
            <AssetMarketDetails
              asset={bip44BalanceData.updatedAsset}
              address={address}
            />
          ) : (
            <AssetMarketDetailsSection
              asset={asset}
              chainId={chainId}
              address={address}
              selectedAccount={selectedAccount}
              nativeBalances={nativeBalances}
              isNative={isNative}
              decimals={decimals}
              currentPrice={currentPrice}
            />
          )}
          <Box
            borderColor={BorderColor.borderMuted}
            marginInline={4}
            style={{ height: '1px', borderBottomWidth: 0 }}
          ></Box>
          <Box marginBottom={4}>
            <Text paddingInline={4} variant={TextVariant.headingSm}>
              {t('yourActivity')}
            </Text>
            {showUnifiedTransactionList ? (
              <UnifiedTransactionList
                tokenAddress={address}
                hideNetworkFilter
                tokenChainIdOverride={chainId}
              />
            ) : (
              <TransactionList
                tokenAddress={address}
                hideNetworkFilter
                overrideFilterForCurrentChain={type === AssetType.native}
              />
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
