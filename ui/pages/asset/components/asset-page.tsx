import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  BtcMethod,
  EthMethod,
  SolMethod,
  TrxAccountType,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  type CaipAssetType,
  Hex,
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
import TokenCell from '../../../components/app/assets/token-cell';
import {
  TokenFiatDisplayInfo,
  type TokenWithFiatAmount,
} from '../../../components/app/assets/types';
import { ActivityList } from '../../../components/multichain/activity-v2/activity-list';
import CoinButtons from '../../../components/app/wallet-overview/coin-buttons';
import { AddressCopyButton } from '../../../components/multichain';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getDataCollectionForMarketing,
  getIsBridgeChain,
  getIsSwapsChain,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
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
import { useMusdCtaVisibility } from '../../../hooks/musd';
import { MusdAssetCta } from '../../../components/app/musd';
import { AssetMarketDetails } from './asset-market-details';
import AssetChart from './chart/asset-chart';
import TokenButtons from './token-buttons';
import { TronDailyResources } from './tron-daily-resources';

// TODO BIP44 Refactor: BIP-44 has been enabled and is stable, this page needs a significant refactor to remove confusing branching logic
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

  const { chainId, type, symbol, name, image } = asset;

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

  // mUSD CTA visibility check
  const { shouldShowAssetOverviewCta: checkMusdCtaVisibility } =
    useMusdCtaVisibility();

  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

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

  const assetWithBalance = accountGroupIdAssets[chainId]?.find(
    (item) =>
      item.assetId.toLowerCase() === address.toLowerCase() ||
      // TODO: This is a workaround for non-evm native assets, as the address that is received here is blank
      (!address && !isEvm && item.isNative),
  );

  address = assetWithBalance?.assetId || address;
  const assetId = assetWithBalance?.assetId || '';
  const balance = assetWithBalance?.balance ?? '0';
  const tokenFiatAmount = assetWithBalance?.fiat?.balance ?? 0;
  const tokenHexBalance = assetWithBalance?.rawBalance as string;

  const updatedAsset = {
    ...asset,
    balance: {
      value: hexToDecimal(tokenHexBalance),
      display: balance,
      fiat: String(tokenFiatAmount),
    },
  };

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

  const tokenWithFiatAmount = {
    address: isEvm ? address : assetId,
    chainId,
    symbol,
    image,
    title: name ?? symbol,
    tokenFiatAmount: showFiat ? tokenFiatAmount : null,
    string: balance ? balance.toString() : '',
    decimals: asset.decimals,
    aggregators:
      type === AssetType.token && asset.aggregators ? asset.aggregators : [],
    isNative: type === AssetType.native,
    balance,
    secondary: balance ? Number(balance) : 0,
    accountType: bip44Asset?.accountType,
    assetId: bip44Asset?.assetId ?? assetId,
  };
  const { safeChains } = useSafeChains();

  // Check if we should show Tron resources
  const isTron = useMultichainSelector(getMultichainIsTron, selectedAccount);
  const showTronResources = isTron && type === AssetType.native;

  return (
    <Box className="asset__content">
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        paddingBottom={3}
        paddingLeft={2}
        paddingRight={4}
        className="pt-4 sticky top-0 z-10 bg-background-default"
      >
        <Box flexDirection={BoxFlexDirection.Row}>
          <ButtonIcon
            color={IconColor.IconDefault}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back') as string}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(-1)}
            className="asset-page__back-button"
          />
        </Box>
        {optionsButton}
      </Box>
      <Box paddingLeft={4}>
        <Text
          data-testid="asset-name"
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
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
          <TokenButtons token={updatedAsset} disableSendForNonEvm />
        )}
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} paddingTop={3}>
        {showTronResources && (
          <Box>
            <TronDailyResources
              account={selectedAccount}
              chainId={chainId}
              t={t}
            />
            <Box
              marginTop={2}
              marginBottom={2}
              borderColor={BoxBorderColor.BorderMuted}
              className="asset-page__divider"
            />
          </Box>
        )}
        <Text
          variant={TextVariant.HeadingSm}
          className="asset-page__balance-heading"
        >
          {t('yourBalance')}
        </Text>
        {[AssetType.token, AssetType.native].includes(type) && (
          <TokenCell
            key={`${symbol}-${address}`}
            token={tokenWithFiatAmount as TokenWithFiatAmount}
            safeChains={safeChains}
            showMerklBadge
          />
        )}
        {/* mUSD Conversion CTA - shows for eligible stablecoins */}
        {!isNativeAsset(updatedAsset) &&
          type === AssetType.token &&
          isEvm &&
          checkMusdCtaVisibility({
            address: (asset as { address: Hex }).address,
            chainId,
            symbol,
          }) && (
            <Box marginTop={2} paddingLeft={4} paddingRight={4}>
              <MusdAssetCta
                token={{
                  address: (asset as { address: Hex }).address,
                  chainId: chainId as string,
                  symbol,
                  balance: String(balance),
                  fiatBalance: String(tokenFiatAmount),
                }}
                variant="card"
              />
            </Box>
          )}
        <Box marginTop={6} flexDirection={BoxFlexDirection.Column} gap={4}>
          {[AssetType.token, AssetType.native].includes(type) && (
            <Box
              flexDirection={BoxFlexDirection.Column}
              paddingLeft={4}
              paddingRight={4}
            >
              <Text
                variant={TextVariant.HeadingSm}
                className="asset-page__details-heading"
              >
                {t('tokenDetails')}
              </Text>
              <Box flexDirection={BoxFlexDirection.Column} gap={2}>
                {renderRow(
                  t('network'),
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    gap={2}
                    data-testid="asset-network"
                  >
                    <AvatarNetwork
                      src={tokenChainImage}
                      name={networkName}
                      size={AvatarNetworkSize.Xs}
                    />
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {networkName}
                    </Text>
                  </Box>,
                )}
                {shouldShowContractAddress && (
                  <Box>
                    {renderRow(
                      t('contractAddress'),
                      <AddressCopyButton address={contractAddress} shorten />,
                    )}
                    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
                      {asset.decimals !== undefined &&
                        renderRow(
                          t('tokenDecimal'),
                          <Text
                            variant={TextVariant.BodyMd}
                            fontWeight={FontWeight.Medium}
                          >
                            {asset.decimals}
                          </Text>,
                        )}
                      {asset.aggregators && asset.aggregators.length > 0 && (
                        <Box>
                          <Text
                            variant={TextVariant.BodyMd}
                            fontWeight={FontWeight.Medium}
                            color={TextColor.TextAlternative}
                          >
                            {t('tokenList')}
                          </Text>
                          <Text
                            variant={TextVariant.BodyMd}
                            fontWeight={FontWeight.Medium}
                          >
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
                    <TextButton size={TextButtonSize.BodyMd} asChild>
                      <a
                        className="asset-page__spending-caps"
                        href={portfolioSpendingCapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('editInPortfolio')}
                      </a>
                    </TextButton>,
                  )}
              </Box>
            </Box>
          )}
          <AssetMarketDetails asset={updatedAsset} address={address} />
          <Box
            borderColor={BoxBorderColor.BorderMuted}
            className="asset-page__divider"
          />
          <Box marginBottom={4}>
            <Text
              variant={TextVariant.HeadingSm}
              className="asset-page__activity-heading"
            >
              {t('yourActivity')}
            </Text>
            <ActivityList
              filter={{
                chainId: caipChainId,
                assetScope:
                  type === AssetType.native
                    ? {
                        kind: 'native',
                        ...(!isEvm && { caipAssetType: address }),
                      }
                    : { kind: 'token', tokenAddress: address },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

function renderRow(leftColumn: string, rightColumn: ReactNode) {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
    >
      <Text
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
      >
        {leftColumn}
      </Text>
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {rightColumn}
      </Text>
    </Box>
  );
}

export default AssetPage;
