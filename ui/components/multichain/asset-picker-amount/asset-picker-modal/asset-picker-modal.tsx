import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import type {
  Token,
  TokenListMap,
  TokenListToken,
} from '@metamask/assets-controllers';
import { isCaipChainId, isStrictHexString, type Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { debounce } from 'lodash';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Box,
  AvatarTokenSize,
  AvatarToken,
  Text,
  PickerNetwork,
} from '../../../component-library';
import {
  BorderRadius,
  TextVariant,
  TextAlign,
  Display,
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Toast, ToastContainer } from '../../toast';

import { AssetType } from '../../../../../shared/constants/transaction';
import {
  getAllTokens,
  getSelectedEvmInternalAccount,
  getTokenExchangeRates,
  getTokenList,
  getUseExternalServices,
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  hasCreatedSolanaAccount,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../selectors';
import { getRenderableTokenData } from '../../../../hooks/useTokensToSearch';
import { getSwapsBlockedTokens } from '../../../../ducks/send';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { AvatarType } from '../../avatar-group/avatar-group.types';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../../shared/constants/bridge';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { fetchTopAssetsList } from '../../../../pages/swaps/swaps.util';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getMultichainConversionRate,
  getMultichainCurrencyImage,
  getImageForChainId,
  getMultichainCurrentChainId,
  getMultichainCurrentCurrency,
  getMultichainNativeCurrency,
  getMultichainNetworkConfigurationsByChainId,
  getMultichainSelectedAccountCachedBalance,
  getMultichainIsEvm,
} from '../../../../selectors/multichain';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { useAssetMetadata } from './hooks/useAssetMetadata';
import type {
  ERC20Asset,
  NativeAsset,
  NFT,
  AssetWithDisplayData,
} from './types';
import { AssetPickerModalTabs, TabName } from './asset-picker-modal-tabs';
import { AssetPickerModalNftTab } from './asset-picker-modal-nft-tab';
import AssetList from './AssetList';
import { Search } from './asset-picker-modal-search';
import { AssetPickerModalNetwork } from './asset-picker-modal-network';
import { SolanaAccountCreationPrompt } from './solana-account-creation-prompt';
import { generateTokenList } from './utils';

type AssetPickerModalProps = {
  header: JSX.Element | string | null;
  isOpen: boolean;
  onClose: () => void;
  action?: 'send' | 'receive' | 'bridge' | 'swap';
  asset?:
    | ERC20Asset
    | NativeAsset
    | Pick<NFT, 'type' | 'tokenId' | 'image' | 'symbol' | 'address'>;
  onBack?: () => void;
  onAssetChange: (
    asset: AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset>,
  ) => void;
  /**
   * Sending asset for UI treatments; only for dest component
   */
  sendingAsset?: { image: string; symbol: string } | undefined;
  onNetworkPickerClick?: () => void;
  /**
   * Generator function that returns a list of tokens sorted by a custom order.
   */
  customTokenListGenerator?: Generator<
    AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
  >;
  isTokenListLoading?: boolean;
} & Pick<
  React.ComponentProps<typeof AssetPickerModalTabs>,
  'visibleTabs' | 'defaultActiveTabKey'
> &
  Pick<
    React.ComponentProps<typeof AssetPickerModalNetwork>,
    'network' | 'networks' | 'isMultiselectEnabled' | 'selectedChainIds'
  >;

const MAX_UNOWNED_TOKENS_RENDERED = 30;

export function AssetPickerModal({
  header,
  isOpen,
  onClose,
  onBack,
  asset,
  onAssetChange,
  sendingAsset,
  network,
  networks,
  action,
  onNetworkPickerClick,
  customTokenListGenerator,
  isTokenListLoading = false,
  isMultiselectEnabled,
  selectedChainIds,
  ...tabProps
}: AssetPickerModalProps) {
  const t = useI18nContext();
  const [showSolanaAccountCreatedToast, setShowSolanaAccountCreatedToast] =
    useState(false);

  const prevNeedsSolanaAccountRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const debouncedSetSearchQuery = useCallback(
    debounce((value) => {
      setDebouncedSearchQuery(value);
    }, 200),
    [],
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller and debounce on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      debouncedSetSearchQuery.cancel();
    };
  }, []);

  useEffect(() => {
    debouncedSetSearchQuery(searchQuery);
  }, [searchQuery, debouncedSetSearchQuery]);

  const swapsBlockedTokens = useSelector(getSwapsBlockedTokens);
  const memoizedSwapsBlockedTokens = useMemo(() => {
    return new Set<string>(swapsBlockedTokens);
  }, [swapsBlockedTokens]);

  const handleAssetChange = useCallback(onAssetChange, [onAssetChange]);

  const currentChainId = useSelector(getMultichainCurrentChainId);
  const allNetworks = useSelector(getMultichainNetworkConfigurationsByChainId);
  const selectedNetwork =
    network ??
    (currentChainId && allNetworks[currentChainId as keyof typeof allNetworks]);
  const allNetworksToUse = networks ?? Object.values(allNetworks ?? {});
  // This indicates whether tokens in the wallet's active network are displayed
  const isSelectedNetworkActive = selectedNetwork.chainId === currentChainId;
  const isEvm = useMultichainSelector(getMultichainIsEvm);

  useEffect(() => {
    setSearchQuery('');
  }, []);

  const nativeCurrencyImage = useMultichainSelector(getMultichainCurrencyImage);
  const nativeCurrency = useMultichainSelector(getMultichainNativeCurrency);
  const balanceValue = useMultichainSelector(
    getMultichainSelectedAccountCachedBalance,
  );

  const tokenConversionRates = useMultichainSelector(getTokenExchangeRates);
  const conversionRate = useMultichainSelector(getMultichainConversionRate);
  const currentCurrency = useSelector(getMultichainCurrentCurrency);

  // Default to false before the code fence is enabled (will not render the prompt)
  let needsSolanaAccount = false;
  let hasSolanaAccount = false;

  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  // Check if we need to show the Solana account creation UI when Solana is selected
  hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  needsSolanaAccount =
    !hasSolanaAccount && selectedNetwork.chainId === MultichainNetworks.SOLANA;
  ///: END:ONLY_INCLUDE_IF

  // watches for needsSolanaAccount changes to show the Solana Account created toast
  useEffect(() => {
    if (
      prevNeedsSolanaAccountRef.current === true &&
      !needsSolanaAccount &&
      hasSolanaAccount &&
      showSolanaAccountCreatedToast === false
    ) {
      setShowSolanaAccountCreatedToast(true);
    }
    prevNeedsSolanaAccountRef.current = needsSolanaAccount;
  }, [needsSolanaAccount, hasSolanaAccount, showSolanaAccountCreatedToast]);

  const { address: selectedEvmAddress } = useSelector(
    getSelectedEvmInternalAccount,
  );

  const detectedTokens: Record<Hex, Record<string, Token[]>> = useSelector(
    getAllTokens,
  );
  // This only returns the detected tokens for the selected EVM account address
  const allDetectedTokens = useMemo(
    () =>
      (isCaipChainId(currentChainId)
        ? []
        : detectedTokens?.[currentChainId]?.[selectedEvmAddress]) ?? [],
    [detectedTokens, currentChainId, selectedEvmAddress],
  );

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const evmTokenMetadataByAddress = useSelector(getTokenList) as TokenListMap;

  const allowExternalServices = useSelector(getUseExternalServices);
  // Swaps top tokens
  const { value: topTokens } = useAsyncResult<
    { address: Hex }[] | undefined
  >(async () => {
    if (allowExternalServices && selectedNetwork?.chainId) {
      return await fetchTopAssetsList(selectedNetwork.chainId);
    }
    return undefined;
  }, [selectedNetwork?.chainId, allowExternalServices]);

  const getIsDisabled = useCallback(
    ({
      address,
      symbol,
    }:
      | TokenListToken
      | AssetWithDisplayData<ERC20Asset>
      | AssetWithDisplayData<NativeAsset>) => {
      const isDisabled = sendingAsset?.symbol
        ? !isEqualCaseInsensitive(sendingAsset.symbol, symbol) &&
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          memoizedSwapsBlockedTokens.has(address || '')
        : false;

      return isDisabled;
    },
    [sendingAsset?.symbol, memoizedSwapsBlockedTokens],
  );

  const filteredTokenList = useMemo(() => {
    const filteredTokens: (
      | AssetWithDisplayData<ERC20Asset>
      | AssetWithDisplayData<NativeAsset>
    )[] = [];
    // List of token identifiers formatted like `chainId:address`
    const filteredTokensAddresses = new Set<string | undefined>();
    const getTokenKey = (address?: string | null, tokenChainId?: string) =>
      `${address?.toLowerCase() ?? zeroAddress()}:${
        tokenChainId ?? currentChainId
      }`;
    // If customTokenListGenerator is passed in, use it to generate the filtered tokens
    // Otherwise use the default tokenGenerator
    const tokenGenerator = customTokenListGenerator
      ? customTokenListGenerator
      : generateTokenList({
          multichainTokensWithBalance,
          nativeCurrency,
          nativeCurrencyImage,
          balanceValue,
          currentChainId,
          isEvm,
          selectedNetwork,
          allDetectedTokens,
          topTokens,
          evmTokenMetadataByAddress,
        });

    for (const token of tokenGenerator) {
      // Check whether token should be visible in the list
      if (action === 'send' && token.balance === undefined) {
        continue;
      }

      const { symbol, address, chainId } = token;
      const tokenChainId = chainId ?? selectedNetwork?.chainId;
      const trimmedSearchQuery = debouncedSearchQuery.trim().toLowerCase();

      if (filteredTokensAddresses.has(getTokenKey(address, tokenChainId))) {
        continue;
      }
      if (
        !Boolean(
          !trimmedSearchQuery ||
            symbol?.toLowerCase().indexOf(trimmedSearchQuery) !== -1 ||
            address?.toLowerCase().indexOf(trimmedSearchQuery) !== -1,
        )
      ) {
        continue;
      }
      if (
        isMultiselectEnabled
          ? tokenChainId &&
            selectedChainIds &&
            selectedChainIds.indexOf(tokenChainId) === -1
          : selectedNetwork?.chainId !== tokenChainId
      ) {
        continue;
      }

      filteredTokensAddresses.add(getTokenKey(token.address, token.chainId));

      // Build token data
      const tokenWithBalanceData =
        !customTokenListGenerator && isStrictHexString(token.address)
          ? getRenderableTokenData(
              token.address
                ? ({
                    ...token,
                    ...evmTokenMetadataByAddress[token.address.toLowerCase()],
                    type: AssetType.token,
                  } as AssetWithDisplayData<ERC20Asset>)
                : token,
              tokenConversionRates,
              conversionRate,
              currentCurrency,
              token.chainId,
              evmTokenMetadataByAddress,
            )
          : (token as unknown as AssetWithDisplayData<ERC20Asset>);

      // Add selected asset to the top of the list if it is the selected asset
      if (
        asset?.address === tokenWithBalanceData.address &&
        selectedNetwork?.chainId === tokenWithBalanceData.chainId
      ) {
        filteredTokens.unshift(tokenWithBalanceData);
      } else {
        filteredTokens.push(tokenWithBalanceData);
      }

      if (filteredTokens.length > MAX_UNOWNED_TOKENS_RENDERED) {
        break;
      }
    }

    return filteredTokens;
  }, [
    currentChainId,
    debouncedSearchQuery,
    isMultiselectEnabled,
    selectedChainIds,
    selectedNetwork?.chainId,
    customTokenListGenerator,
    action,
    evmTokenMetadataByAddress,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    asset,
  ]);

  // This fetches the metadata for the asset if it is not already in the filteredTokenList
  const unlistedAssetMetadata = useAssetMetadata(
    searchQuery,
    filteredTokenList.length === 0,
    abortControllerRef,
    selectedNetwork?.chainId,
  );

  const displayedTokens = useMemo(() => {
    return unlistedAssetMetadata ? [unlistedAssetMetadata] : filteredTokenList;
  }, [unlistedAssetMetadata, filteredTokenList]);

  const getNetworkPickerLabel = () => {
    if (!isMultiselectEnabled) {
      return (
        (selectedNetwork?.chainId &&
          NETWORK_TO_NAME_MAP[
            selectedNetwork.chainId as keyof typeof NETWORK_TO_NAME_MAP
          ]) ??
        selectedNetwork?.name ??
        t('bridgeSelectNetwork')
      );
    }
    switch (selectedChainIds?.length) {
      case allNetworksToUse.length:
        return t('allNetworks');
      case 1:
        return t('singleNetwork');
      case 0:
        return t('bridgeSelectNetwork');
      default:
        return t('someNetworks', [selectedChainIds?.length]);
    }
  };

  return (
    <Modal
      className="asset-picker-modal"
      isOpen={isOpen}
      onClose={() => {
        setSearchQuery('');
        debouncedSetSearchQuery.cancel();
        abortControllerRef.current?.abort();
        onClose();
      }}
      data-testid="asset-picker-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader
          onClose={() => {
            // setSearchQuery('');
            onClose();
          }}
          onBack={asset ? undefined : onBack}
        >
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {header}
          </Text>
        </ModalHeader>
        {showSolanaAccountCreatedToast && (
          <div
            style={{
              position: 'absolute',
              bottom: 15,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <ToastContainer>
              <Toast
                text={t('bridgeSolanaAccountCreated')}
                onClose={() => setShowSolanaAccountCreatedToast(false)}
                startAdornment={
                  <img
                    src="/images/solana-logo.svg"
                    alt="Solana Logo"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                    }}
                  />
                }
                autoHideTime={5000}
                onAutoHideToast={() => setShowSolanaAccountCreatedToast(false)}
              />
            </ToastContainer>
          </div>
        )}
        {sendingAsset?.image && sendingAsset?.symbol && (
          <Box
            display={Display.Flex}
            gap={1}
            alignItems={AlignItems.center}
            marginInline="auto"
          >
            <AvatarToken
              borderRadius={BorderRadius.full}
              src={sendingAsset.image}
              name={sendingAsset.symbol}
              size={AvatarTokenSize.Xs}
            />
            <Text variant={TextVariant.bodySm}>
              {t('sendingAsset', [sendingAsset.symbol])}
            </Text>
          </Box>
        )}
        {onNetworkPickerClick && (
          <Box
            className="network-picker"
            display={Display.Flex}
            justifyContent={JustifyContent.center}
          >
            <PickerNetwork
              label={getNetworkPickerLabel()}
              src={
                selectedNetwork?.chainId
                  ? getImageForChainId(selectedNetwork.chainId)
                  : undefined
              }
              avatarGroupProps={
                isMultiselectEnabled && selectedChainIds
                  ? {
                      limit: 2,
                      members: selectedChainIds.map((c) => ({
                        avatarValue: getImageForChainId(c) ?? '',
                        symbol:
                          NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                            c as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                          ],
                      })),
                      avatarType: AvatarType.NETWORK,
                    }
                  : undefined
              }
              onClick={onNetworkPickerClick}
              data-testid="multichain-asset-picker__network"
            />
          </Box>
        )}
        <Box className="modal-tab__wrapper">
          {/* Show Solana account creation prompt if the destination is Solana but no Solana account exists */}
          {needsSolanaAccount ? (
            <SolanaAccountCreationPrompt />
          ) : (
            <AssetPickerModalTabs {...tabProps}>
              <React.Fragment key={TabName.TOKENS}>
                <Search
                  searchQuery={searchQuery}
                  onChange={(value) => {
                    // Cancel previous asset metadata fetch
                    abortControllerRef.current?.abort();
                    setSearchQuery(value);
                  }}
                />
                <AssetList
                  network={network}
                  handleAssetChange={(selectedAsset) => {
                    setSearchQuery('');
                    handleAssetChange(selectedAsset);
                  }}
                  asset={asset?.type === AssetType.NFT ? undefined : asset}
                  tokenList={displayedTokens}
                  isTokenDisabled={getIsDisabled}
                  isTokenListLoading={isTokenListLoading}
                  assetItemProps={{
                    isTitleNetworkName:
                      // For src cross-chain swaps assets
                      isMultiselectEnabled,
                    isTitleHidden:
                      // For dest cross-chain swaps assets
                      !isSelectedNetworkActive,
                  }}
                />
              </React.Fragment>
              <React.Fragment key={TabName.NFTS}>
                <Search
                  isNFTSearch
                  searchQuery={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                />
                <AssetPickerModalNftTab
                  searchQuery={searchQuery}
                  onClose={onClose}
                />
              </React.Fragment>
            </AssetPickerModalTabs>
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
}
