import React, { useState, useCallback, useMemo, useContext } from 'react';

import { useSelector } from 'react-redux';
import { isEqual, uniqBy } from 'lodash';
import { Tab, Tabs } from '../../../ui/tabs';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  TextFieldSearch,
  Box,
  ButtonIconSize,
  TextFieldSearchSize,
  AvatarTokenSize,
  AvatarToken,
  Text,
} from '../../../component-library';
import {
  BlockSize,
  BorderRadius,
  TextVariant,
  TextAlign,
  Display,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { AssetType } from '../../../../../shared/constants/transaction';

import { useNftsCollections } from '../../../../hooks/useNftsCollections';
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
import { useEqualityCheck } from '../../../../hooks/useEqualityCheck';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  getSendAnalyticProperties,
  getSwapsBlockedTokens,
} from '../../../../ducks/send';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { Asset, Collection, Token } from './types';
import { AssetPickerModalNftTab } from './asset-picker-modal-nft-tab';

import AssetList from './AssetList';

type AssetPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onAssetChange: (asset: Asset) => void;
  sendingAssetImage?: string;
  sendingAssetSymbol?: string;
};

const MAX_UNOWNED_TOKENS_RENDERED = 30;

export function AssetPickerModal({
  isOpen,
  onClose,
  asset,
  onAssetChange,
  sendingAssetImage,
  sendingAssetSymbol,
}: AssetPickerModalProps) {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const sendAnalytics = useSelector(getSendAnalyticProperties);

  const [searchQuery, setSearchQuery] = useState('');

  const { collections, previouslyOwnedCollection } = useNftsCollections();

  const collectionsKeys = Object.keys(collections);

  const collectionsData = collectionsKeys.reduce((acc: unknown[], key) => {
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collection = (collections as any)[key];

    const isMatchingQuery = collection.collectionName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (isMatchingQuery) {
      acc.push(collection);
      return acc;
    }
    return acc;
  }, []);

  // filter and exclude ERC1155
  const collectionDataFiltered = (collectionsData as Collection[]).filter(
    (collection) => collection.nfts.length > 0,
  );

  const swapsBlockedTokens = useSelector(getSwapsBlockedTokens);
  const memoizedSwapsBlockedTokens = useMemo(() => {
    return new Set<string>(swapsBlockedTokens);
  }, [swapsBlockedTokens]);

  const isDest = sendingAssetImage && sendingAssetSymbol;

  const handleAssetChange = useCallback(
    (token: Token) => {
      onAssetChange(token);
      trackEvent(
        {
          event: MetaMetricsEventName.sendAssetSelected,
          category: MetaMetricsEventCategory.Send,
          properties: {
            is_destination_asset_picker_modal: Boolean(isDest),
            is_nft: false,
          },
          sensitiveProperties: {
            ...sendAnalytics,
            new_asset_symbol: token.symbol,
            new_asset_address: token.address,
          },
        },
        { excludeMetaMetricsId: false },
      );
      onClose();
    },
    [onAssetChange],
  );

  const defaultActiveTabKey = asset?.type === AssetType.NFT ? 'nfts' : 'tokens';

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

  const detectedTokens = useSelector(getAllTokens);
  const tokens = detectedTokens?.[chainId]?.[selectedAddress] ?? [];

  const { tokensWithBalances } = useTokenTracker({
    tokens,
    address: selectedAddress,
    hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
  });

  // Swaps token list
  const tokenList = useSelector(getTokenList) as Record<string, Token>;
  const topTokens = useSelector(getTopAssets, isEqual);

  const usersTokens = uniqBy([...tokensWithBalances, ...tokens], 'address');

  const memoizedUsersTokens = useEqualityCheck(usersTokens);

  const filteredTokenList = useMemo(() => {
    const nativeToken = {
      address: null,
      symbol: nativeCurrency,
      decimals: 18,
      image: nativeCurrencyImage,
      balance: balanceValue,
      type: AssetType.native,
    };

    const filteredTokens: Token[] = [];
    // undefined would be the native token address
    const filteredTokensAddresses = new Set<string | undefined>();

    const getIsDisabled = ({ address, symbol }: Token) => {
      const isDisabled = sendingAssetSymbol
        ? !isEqualCaseInsensitive(sendingAssetSymbol, symbol) &&
          memoizedSwapsBlockedTokens.has(address || '')
        : false;

      return isDisabled;
    };

    function* tokenGenerator() {
      yield nativeToken;

      const blockedTokens = [];

      for (const token of memoizedUsersTokens) {
        yield token;
      }

      // topTokens should already be sorted by popularity
      for (const address of Object.keys(topTokens)) {
        const token = tokenList?.[address];
        if (token) {
          if (isDest && getIsDisabled(token)) {
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
    }

    let token: Token;
    for (token of tokenGenerator()) {
      if (
        token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !filteredTokensAddresses.has(token.address?.toLowerCase())
      ) {
        filteredTokensAddresses.add(token.address?.toLowerCase());
        filteredTokens.push(
          getRenderableTokenData(
            token.address
              ? {
                  ...token,
                  ...tokenList[token.address.toLowerCase()],
                  type: AssetType.token,
                }
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
    memoizedUsersTokens,
    topTokens,
    searchQuery,
    nativeCurrency,
    nativeCurrencyImage,
    balanceValue,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    chainId,
    tokenList,
    sendingAssetSymbol,
  ]);

  const Search = useCallback(
    ({
      isNFTSearch = false,
      props,
    }: {
      isNFTSearch?: boolean;
      props?: React.ComponentProps<typeof Box>;
    }) => (
      <Box padding={4} {...props}>
        <TextFieldSearch
          borderRadius={BorderRadius.LG}
          placeholder={t(isNFTSearch ? 'searchNfts' : 'searchTokens')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          error={false}
          autoFocus
          autoComplete={false}
          width={BlockSize.Full}
          clearButtonOnClick={() => setSearchQuery('')}
          clearButtonProps={{
            size: ButtonIconSize.Sm,
          }}
          showClearButton={true}
          className="asset-picker-modal__search-list"
          inputProps={{
            'data-testid': 'asset-picker-modal-search-input',
          }}
          endAccessory={null}
          size={TextFieldSearchSize.Lg}
        />
      </Box>
    ),
    [searchQuery],
  );

  return (
    <Modal
      className="asset-picker-modal"
      isOpen={isOpen}
      onClose={onClose}
      data-testid="asset-picker-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader paddingBottom={2} onClose={onClose}>
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {t(isDest ? 'sendSelectReceiveAsset' : 'sendSelectSendAsset')}
          </Text>
        </ModalHeader>
        {isDest && (
          <Box
            display={Display.Flex}
            gap={1}
            alignItems={AlignItems.center}
            marginInline="auto"
            marginBottom={3}
          >
            <AvatarToken
              borderRadius={BorderRadius.full}
              src={sendingAssetImage}
              size={AvatarTokenSize.Xs}
            />
            <Text variant={TextVariant.bodySm}>
              {t('sendingAsset', [sendingAssetSymbol])}
            </Text>
          </Box>
        )}
        <Box className="modal-tab__wrapper">
          {isDest ? (
            <>
              <Search props={{ paddingTop: 1 }} />
              <AssetList
                handleAssetChange={handleAssetChange}
                asset={asset}
                tokenList={filteredTokenList}
                sendingAssetSymbol={sendingAssetSymbol}
                memoizedSwapsBlockedTokens={memoizedSwapsBlockedTokens}
              />
            </>
          ) : (
            <Tabs
              defaultActiveTabKey={defaultActiveTabKey}
              tabsClassName="modal-tab__tabs"
            >
              {
                <Tab
                  activeClassName="modal-tab__tab--active"
                  className="modal-tab__tab"
                  name={t('tokens')}
                  tabKey="tokens"
                >
                  <Search />
                  <AssetList
                    handleAssetChange={handleAssetChange}
                    asset={asset}
                    tokenList={filteredTokenList}
                    memoizedSwapsBlockedTokens={memoizedSwapsBlockedTokens}
                  />
                </Tab>
              }

              {
                <Tab
                  activeClassName="modal-tab__tab--active"
                  className="modal-tab__tab"
                  name={t('nfts')}
                  tabKey="nfts"
                >
                  <AssetPickerModalNftTab
                    collectionDataFiltered={collectionDataFiltered}
                    previouslyOwnedCollection={previouslyOwnedCollection}
                    onClose={onClose}
                    renderSearch={() => Search({ isNFTSearch: true })}
                  />
                </Tab>
              }
            </Tabs>
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
}
