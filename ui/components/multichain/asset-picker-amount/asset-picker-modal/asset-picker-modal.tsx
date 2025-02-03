import React, { useState, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { isEqual, uniqBy } from 'lodash';
import {
  Token,
  TokenListMap,
  TokenListToken,
} from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
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
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { AssetType } from '../../../../../shared/constants/transaction';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../../shared/modules/selectors/networks';
import {
  getAllTokens,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
  getTokenList,
  getUseExternalServices,
} from '../../../../selectors';
import {
  getConversionRate,
  getCurrentCurrency,
  getNativeCurrency,
} from '../../../../ducks/metamask/metamask';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { getRenderableTokenData } from '../../../../hooks/useTokensToSearch';
import { getSwapsBlockedTokens } from '../../../../ducks/send';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { AvatarType } from '../../avatar-group/avatar-group.types';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../../shared/constants/bridge';
import { useAsyncResult } from '../../../../hooks/useAsyncResult';
import { fetchTopAssetsList } from '../../../../pages/swaps/swaps.util';
import {
  ERC20Asset,
  NativeAsset,
  NFT,
  AssetWithDisplayData,
  TokenWithBalance,
} from './types';
import { AssetPickerModalTabs, TabName } from './asset-picker-modal-tabs';
import { AssetPickerModalNftTab } from './asset-picker-modal-nft-tab';
import AssetList from './AssetList';
import { Search } from './asset-picker-modal-search';
import { AssetPickerModalNetwork } from './asset-picker-modal-network';

type AssetPickerModalProps = {
  header: JSX.Element | string | null;
  isOpen: boolean;
  onClose: () => void;
  action?: 'send' | 'receive';
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
   * Generator function that returns a list of tokens filtered by a predicate and sorted
   * by a custom order.
   */
  customTokenListGenerator?: (
    filterPredicate: (
      symbol: string,
      address?: null | string,
      chainId?: string,
    ) => boolean,
  ) => Generator<
    AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
  >;
  isTokenListLoading?: boolean;
  autoFocus: boolean;
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
  autoFocus,
  ...tabProps
}: AssetPickerModalProps) {
  const t = useI18nContext();

  const [searchQuery, setSearchQuery] = useState('');

  const swapsBlockedTokens = useSelector(getSwapsBlockedTokens);
  const memoizedSwapsBlockedTokens = useMemo(() => {
    return new Set<string>(swapsBlockedTokens);
  }, [swapsBlockedTokens]);

  const handleAssetChange = useCallback(onAssetChange, [onAssetChange]);

  const currentChainId = useSelector(getCurrentChainId);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const selectedNetwork =
    network ?? (currentChainId && allNetworks[currentChainId]);
  const allNetworksToUse = networks ?? Object.values(allNetworks ?? {});
  // This indicates whether tokens in the wallet's active network are displayed
  const isSelectedNetworkActive = selectedNetwork.chainId === currentChainId;

  const nativeCurrencyImage = useSelector(getNativeCurrencyImage);
  const nativeCurrency = useSelector(getNativeCurrency);
  const balanceValue = useSelector(getSelectedAccountCachedBalance);

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const detectedTokens: Record<Hex, Record<string, Token[]>> = useSelector(
    getAllTokens,
  );
  const tokens = detectedTokens?.[currentChainId]?.[selectedAddress] ?? [];

  const { tokensWithBalances }: { tokensWithBalances: TokenWithBalance[] } =
    useTokenTracker({
      tokens,
      address: selectedAddress,
      hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
    });

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const tokenList = useSelector(getTokenList) as TokenListMap;

  const allowExternalServices = useSelector(getUseExternalServices);
  // Swaps top tokens
  const { value: topTokensResponse } = useAsyncResult<
    { address: string }[] | undefined
  >(async () => {
    if (allowExternalServices && selectedNetwork?.chainId) {
      return await fetchTopAssetsList(selectedNetwork.chainId);
    }
    return undefined;
  }, [selectedNetwork?.chainId, allowExternalServices]);
  const topTokens = topTokensResponse ?? [];

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
          memoizedSwapsBlockedTokens.has(address || '')
        : false;

      return isDisabled;
    },
    [sendingAsset?.symbol, memoizedSwapsBlockedTokens],
  );

  const memoizedUsersTokens: TokenWithBalance[] = useMemo(() => {
    return uniqBy<TokenWithBalance>(
      [...tokensWithBalances, ...tokens],
      'address',
    );
  }, [tokensWithBalances, tokens]);

  /**
   * Generates a list of tokens sorted in this order
   * - native tokens with balance
   * - tokens with highest to lowest balance in selected currency
   * - selected network's native token
   * - matches URL token parameter
   * - matches search query
   * - detected tokens (without balance)
   * - popularity
   * - all other tokens
   * - blocked tokens
   */
  const tokenListGenerator = useCallback(
    function* (
      shouldAddToken: (
        symbol: string,
        address?: null | string,
        tokenChainId?: string,
      ) => boolean,
    ): Generator<
      | AssetWithDisplayData<NativeAsset>
      | ((Token | TokenListToken) & {
          chainId: string;
          balance?: string;
          string?: string;
        })
    > {
      const blockedTokens = [];

      // Yield multichain tokens with balances
      if (isMultiselectEnabled) {
        for (const token of multichainTokensWithBalance) {
          if (shouldAddToken(token.symbol, token.address, token.chainId)) {
            yield token;
          }
        }
      }

      // Yield the native token for the selected chain
      const nativeToken: AssetWithDisplayData<NativeAsset> = {
        address: null,
        symbol: nativeCurrency,
        decimals: 18,
        image: nativeCurrencyImage,
        balance: balanceValue,
        string: undefined,
        chainId: currentChainId,
        type: AssetType.native,
      };

      if (
        shouldAddToken(
          nativeToken.symbol,
          nativeToken.address,
          nativeToken.chainId,
        )
      ) {
        yield nativeToken;
      }

      for (const token of memoizedUsersTokens) {
        if (shouldAddToken(token.symbol, token.address, currentChainId)) {
          yield { ...token, chainId: currentChainId };
        }
      }

      // topTokens are sorted by popularity
      for (const topToken of topTokens) {
        const token = tokenList?.[topToken.address];
        if (
          token &&
          shouldAddToken(token.symbol, token.address, currentChainId)
        ) {
          if (getIsDisabled(token)) {
            blockedTokens.push(token);
            continue;
          } else {
            yield { ...token, chainId: currentChainId };
          }
        }
      }

      for (const token of Object.values(tokenList)) {
        if (shouldAddToken(token.symbol, token.address, currentChainId)) {
          yield { ...token, chainId: currentChainId };
        }
      }

      for (const token of blockedTokens) {
        yield { ...token, chainId: currentChainId };
      }
    },
    [
      nativeCurrency,
      nativeCurrencyImage,
      balanceValue,
      memoizedUsersTokens,
      topTokens,
      tokenList,
      getIsDisabled,
      isMultiselectEnabled,
      multichainTokensWithBalance,
    ],
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

    // Default filter predicate for whether a token should be included in displayed list
    const shouldAddToken = (
      symbol: string,
      address?: string | null,
      tokenChainId?: string,
    ) => {
      const trimmedSearchQuery = searchQuery.trim().toLowerCase();
      const isMatchedBySearchQuery = Boolean(
        !trimmedSearchQuery ||
          symbol?.toLowerCase().includes(trimmedSearchQuery) ||
          address?.toLowerCase().includes(trimmedSearchQuery),
      );
      const isTokenInSelectedChain = isMultiselectEnabled
        ? tokenChainId && selectedChainIds?.includes(tokenChainId)
        : selectedNetwork?.chainId === tokenChainId;

      return Boolean(
        isTokenInSelectedChain &&
          isMatchedBySearchQuery &&
          !filteredTokensAddresses.has(getTokenKey(address, tokenChainId)),
      );
    };

    // If filteredTokensGenerator is passed in, use it to generate the filtered tokens
    // Otherwise use the default tokenGenerator
    for (const token of (customTokenListGenerator ?? tokenListGenerator)(
      shouldAddToken,
    )) {
      if (action === 'send' && token.balance === undefined) {
        continue;
      }

      filteredTokensAddresses.add(getTokenKey(token.address, token.chainId));
      filteredTokens.push(
        customTokenListGenerator
          ? token
          : getRenderableTokenData(
              token.address
                ? ({
                    ...token,
                    ...tokenList[token.address.toLowerCase()],
                    type: AssetType.token,
                  } as AssetWithDisplayData<ERC20Asset>)
                : token,
              tokenConversionRates,
              conversionRate,
              currentCurrency,
              token.chainId,
              tokenList,
            ),
      );

      if (filteredTokens.length > MAX_UNOWNED_TOKENS_RENDERED) {
        break;
      }
    }

    return filteredTokens;
  }, [
    searchQuery,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    currentChainId,
    tokenListGenerator,
    customTokenListGenerator,
    isMultiselectEnabled,
    selectedChainIds,
    selectedNetwork,
  ]);

  const getNetworkImageUrl = (networkChainId: string) =>
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      networkChainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];

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
      onClose={onClose}
      data-testid="asset-picker-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onClose={onClose} onBack={asset ? undefined : onBack}>
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {header}
          </Text>
        </ModalHeader>
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
              size={AvatarTokenSize.Xs}
            />
            <Text variant={TextVariant.bodySm}>
              {t('sendingAsset', [sendingAsset.symbol])}
            </Text>
          </Box>
        )}
        {onNetworkPickerClick && (
          <Box className="network-picker">
            <PickerNetwork
              label={getNetworkPickerLabel()}
              src={
                selectedNetwork?.chainId
                  ? getNetworkImageUrl(selectedNetwork.chainId)
                  : undefined
              }
              avatarGroupProps={
                isMultiselectEnabled && selectedChainIds
                  ? {
                      limit: 2,
                      members: selectedChainIds.map((c) => ({
                        avatarValue: getNetworkImageUrl(c),
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
          <AssetPickerModalTabs {...tabProps}>
            <React.Fragment key={TabName.TOKENS}>
              <Search
                searchQuery={searchQuery}
                onChange={(value) => setSearchQuery(value)}
                autoFocus={autoFocus}
              />
              <AssetList
                network={network}
                handleAssetChange={handleAssetChange}
                asset={asset?.type === AssetType.NFT ? undefined : asset}
                tokenList={filteredTokenList}
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
            <AssetPickerModalNftTab
              key={TabName.NFTS}
              searchQuery={searchQuery}
              onClose={onClose}
              renderSearch={() => (
                <Search
                  isNFTSearch
                  searchQuery={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                />
              )}
            />
          </AssetPickerModalTabs>
        </Box>
      </ModalContent>
    </Modal>
  );
}
