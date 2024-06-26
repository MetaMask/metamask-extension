import React, { useState, useCallback, useMemo, useContext } from 'react';

import { useSelector } from 'react-redux';
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
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
} from '../../../../selectors';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';

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
import { useTokensWithFiltering } from '../../../../hooks/useTokensWithFiltering';
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
      trackEvent({
        event: MetaMetricsEventName.sendAssetSelected,
        category: MetaMetricsEventCategory.Send,
        properties: {
          ...sendAnalytics,
          is_destination_asset_picker_modal: Boolean(isDest),
          new_asset_symbol: token.symbol,
          new_asset_address: token.address,
          is_nft: false,
        },
      });
      onClose();
    },
    [onAssetChange],
  );

  const defaultActiveTabKey = asset?.type === AssetType.NFT ? 'nfts' : 'tokens';

  const nativeCurrencyImage = useSelector(getNativeCurrencyImage);
  const nativeCurrency = useSelector(getNativeCurrency);
  const balanceValue = useSelector(getSelectedAccountCachedBalance);

  const nativeToken = {
    address: null,
    symbol: nativeCurrency,
    decimals: 18,
    image: nativeCurrencyImage,
    balance: balanceValue,
    type: AssetType.native,
  };
  const getIsDisabled = useCallback(
    ({ address, symbol }: Token) => {
      const isDisabled = sendingAssetSymbol
        ? !isEqualCaseInsensitive(sendingAssetSymbol, symbol) &&
          memoizedSwapsBlockedTokens.has(address || '')
        : false;

      return isDest && isDisabled;
    },
    [isDest, memoizedSwapsBlockedTokens, sendingAssetSymbol],
  );
  const filteredTokenList = useTokensWithFiltering<Token>(
    nativeToken,
    searchQuery,
    { type: AssetType.token },
    getIsDisabled,
  );
  const Search = useCallback(
    ({ isNFTSearch = false }: { isNFTSearch?: boolean }) => (
      <Box padding={1} paddingLeft={4} paddingRight={4}>
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
          marginBottom={1}
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
        <ModalHeader onClose={onClose}>
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
            marginBottom={4}
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
              <Search />
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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
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
