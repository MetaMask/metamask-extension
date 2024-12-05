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
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import {
  getAllTokens,
  getCurrentCurrency,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
  getTokenList,
} from '../../../../selectors';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../../../ducks/metamask/metamask';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { getTopAssets } from '../../../../ducks/swaps/swaps';
import { getRenderableTokenData } from '../../../../hooks/useTokensToSearch';
import { getSwapsBlockedTokens } from '../../../../ducks/send';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
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
  onBack?: () => void;
  asset?: ERC20Asset | NativeAsset | Pick<NFT, 'type' | 'tokenId' | 'image'>;
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
  isTokenInSelectedChain: (tokenChainId?: string) => boolean;
  networkPickerProps: React.ComponentProps<typeof PickerNetwork>;
} & Pick<
  React.ComponentProps<typeof AssetPickerModalTabs>,
  'visibleTabs' | 'defaultActiveTabKey'
> &
  Pick<
    React.ComponentProps<typeof AssetPickerModalNetwork>,
    'network' | 'isMultiselectEnabled'
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
  action,
  onNetworkPickerClick,
  customTokenListGenerator,
  isTokenListLoading = false,
  isMultiselectEnabled,
  isTokenInSelectedChain,
  networkPickerProps,
  ...tabProps
}: AssetPickerModalProps) {
  const t = useI18nContext();

  const [searchQuery, setSearchQuery] = useState('');

  const swapsBlockedTokens = useSelector(getSwapsBlockedTokens);
  const memoizedSwapsBlockedTokens = useMemo(() => {
    return new Set<string>(swapsBlockedTokens);
  }, [swapsBlockedTokens]);

  const handleAssetChange = useCallback(onAssetChange, [onAssetChange]);

  const chainId = useSelector(getCurrentChainId);

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
  const tokens = detectedTokens?.[chainId]?.[selectedAddress] ?? [];

  const { tokensWithBalances }: { tokensWithBalances: TokenWithBalance[] } =
    useTokenTracker({
      tokens,
      address: selectedAddress,
      hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
    });

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  // Swaps token list
  const tokenList = useSelector(getTokenList) as TokenListMap;
  const topTokens = useSelector(getTopAssets, isEqual);

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
      const nativeToken: AssetWithDisplayData<NativeAsset> = {
        address: null,
        symbol: nativeCurrency,
        decimals: 18,
        image: nativeCurrencyImage,
        balance: balanceValue,
        string: undefined,
        chainId,
        type: AssetType.native,
      };

      if (shouldAddToken(nativeToken.symbol, nativeToken.address)) {
        yield nativeToken;
      }

      const blockedTokens = [];

      // Yield multichain tokens with balances
      if (isMultiselectEnabled) {
        for (const token of multichainTokensWithBalance) {
          if (shouldAddToken(token.symbol, token.address, token.chainId)) {
            yield token;
          }
        }
      }

      for (const token of memoizedUsersTokens) {
        if (shouldAddToken(token.symbol, token.address)) {
          yield { ...token, chainId };
        }
      }

      // topTokens should already be sorted by popularity
      for (const address of Object.keys(topTokens)) {
        const token = tokenList?.[address];
        if (token && shouldAddToken(token.symbol, token.address)) {
          if (getIsDisabled(token)) {
            blockedTokens.push(token);
            continue;
          } else {
            yield { ...token, chainId };
          }
        }
      }

      for (const token of Object.values(tokenList)) {
        if (shouldAddToken(token.symbol, token.address)) {
          yield { ...token, chainId };
        }
      }

      for (const token of blockedTokens) {
        yield { ...token, chainId };
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
      `${address?.toLowerCase() ?? zeroAddress()}:${tokenChainId ?? chainId}`;

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

      return (
        isTokenInSelectedChain(tokenChainId) &&
        isMatchedBySearchQuery &&
        !filteredTokensAddresses.has(getTokenKey(address, tokenChainId))
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
    chainId,
    tokenListGenerator,
    customTokenListGenerator,
    isMultiselectEnabled,
    isTokenInSelectedChain,
  ]);

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
              label={networkPickerProps.label}
              src={
                networkPickerProps.src ??
                (network?.chainId &&
                  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                    network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ])
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
                autoFocus={false}
              />
              <AssetList
                network={network}
                handleAssetChange={handleAssetChange}
                asset={asset?.type === AssetType.NFT ? undefined : asset}
                tokenList={filteredTokenList}
                isTokenDisabled={getIsDisabled}
                isTokenListLoading={isTokenListLoading}
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
