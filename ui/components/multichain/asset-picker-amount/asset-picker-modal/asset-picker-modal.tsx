import React, { useState, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { isEqual, uniqBy } from 'lodash';
import {
  Token,
  TokenListMap,
  TokenListToken,
} from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
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
  getAllTokens,
  getCurrentChainId,
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
  asset?: ERC20Asset | NativeAsset | Pick<NFT, 'type' | 'tokenId' | 'image'>;
  onAssetChange: (
    asset: AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset>,
  ) => void;
  /**
   * Sending asset for UI treatments; only for dest component
   */
  sendingAsset?: { image: string; symbol: string } | undefined;
  onNetworkPickerClick?: () => void;
} & Pick<
  React.ComponentProps<typeof AssetPickerModalTabs>,
  'visibleTabs' | 'defaultActiveTabKey'
> &
  Pick<React.ComponentProps<typeof AssetPickerModalNetwork>, 'network'>;

const MAX_UNOWNED_TOKENS_RENDERED = 30;

export function AssetPickerModal({
  header,
  isOpen,
  onClose,
  asset,
  onAssetChange,
  sendingAsset,
  network,
  onNetworkPickerClick,
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

  const sortedTokenListGenerator = useCallback(
    function* (): Generator<
      | AssetWithDisplayData<NativeAsset>
      | ((Token | TokenListToken) & {
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
        type: AssetType.native,
      };

      yield nativeToken;

      const blockedTokens = [];

      for (const token of memoizedUsersTokens) {
        yield token;
      }

      // topTokens should already be sorted by popularity
      for (const address of Object.keys(topTokens)) {
        const token = tokenList?.[address];
        if (token) {
          if (getIsDisabled(token)) {
            blockedTokens.push(token);
            continue;
          } else {
            yield token;
          }
        }
      }

      for (const token of Object.values(tokenList)) {
        yield token;
      }

      for (const token of blockedTokens) {
        yield token;
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
    ],
  );

  const filteredTokenList = useMemo(() => {
    const filteredTokens: AssetWithDisplayData<ERC20Asset | NativeAsset>[] = [];
    // undefined would be the native token address
    const filteredTokensAddresses = new Set<string | undefined>();

    for (const token of sortedTokenListGenerator()) {
      if (
        token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !filteredTokensAddresses.has(token.address?.toLowerCase())
      ) {
        filteredTokensAddresses.add(token.address?.toLowerCase());
        filteredTokens.push(
          getRenderableTokenData(
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
            chainId,
            tokenList,
          ),
        );
      }

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
    sortedTokenListGenerator,
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
        <ModalHeader onClose={onClose}>
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
              label={network?.nickname ?? 'Select network'}
              src={
                network?.rpcPrefs && 'imageUrl' in network.rpcPrefs
                  ? (network.rpcPrefs.imageUrl as string)
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
              />
              <AssetList
                handleAssetChange={handleAssetChange}
                asset={asset?.type === AssetType.NFT ? undefined : asset}
                tokenList={filteredTokenList}
                isTokenDisabled={getIsDisabled}
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
