import React, { useState, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { isEqual, uniqBy } from 'lodash';
import { Tab, Tabs } from '../../../ui/tabs';
import NftsItems from '../../../app/nfts-items/nfts-items';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  TextFieldSearch,
  Box,
  Text,
  ButtonLink,
  ButtonLinkSize,
  ButtonIconSize,
  TextFieldSearchSize,
  AvatarTokenSize,
  AvatarToken,
} from '../../../component-library';
import {
  BlockSize,
  BorderRadius,
  TextColor,
  TextVariant,
  TextAlign,
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { AssetType } from '../../../../../shared/constants/transaction';

import { useNftsCollections } from '../../../../hooks/useNftsCollections';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import {
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
  getTokens,
} from '../../../../ducks/metamask/metamask';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { getTopAssets } from '../../../../ducks/swaps/swaps';
import { getRenderableTokenData } from '../../../../hooks/useTokensToSearch';
import { useEqualityCheck } from '../../../../hooks/useEqualityCheck';
import AssetList from './AssetList';
import { Asset, Collection, Token } from './types';

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

  const [searchQuery, setSearchQuery] = useState('');

  const { collections, previouslyOwnedCollection } = useNftsCollections();

  const hasAnyNfts = Object.keys(collections).length > 0;

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

  const handleAssetChange = useCallback(
    (token: Token) => {
      onAssetChange(token);
      onClose();
    },
    [onAssetChange],
  );

  const defaultActiveTabKey = asset?.type === AssetType.NFT ? 'nfts' : 'tokens';

  const isDest = sendingAssetImage && sendingAssetSymbol;
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
  const tokens = useSelector(getTokens, isEqual);
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

    function* tokenGenerator() {
      yield nativeToken;

      for (const token of memoizedUsersTokens) {
        yield token;
      }

      // topTokens should already be sorted by popularity
      for (const address of Object.keys(topTokens)) {
        const token = tokenList?.[address];
        if (token) {
          yield token;
        }
      }

      for (const token of Object.values(tokenList)) {
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
  ]);

  const Search = useCallback(
    () => (
      <Box padding={1} paddingLeft={4} paddingRight={4}>
        <TextFieldSearch
          borderRadius={BorderRadius.LG}
          placeholder={t('searchTokenOrNFT')}
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
                  {hasAnyNfts ? (
                    <Box className="modal-tab__main-view">
                      <Search />
                      <NftsItems
                        collections={collectionDataFiltered}
                        previouslyOwnedCollection={previouslyOwnedCollection}
                        isModal={true}
                        onCloseModal={() => onClose()}
                        showTokenId={true}
                        displayPreviouslyOwnedCollection={false}
                      />
                    </Box>
                  ) : (
                    <Box
                      padding={12}
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      alignItems={AlignItems.center}
                      justifyContent={JustifyContent.center}
                    >
                      <Box justifyContent={JustifyContent.center}>
                        <img src="./images/no-nfts.svg" />
                      </Box>
                      <Box
                        display={Display.Flex}
                        justifyContent={JustifyContent.center}
                        alignItems={AlignItems.center}
                        flexDirection={FlexDirection.Column}
                        className="nfts-tab__link"
                      >
                        <Text
                          color={TextColor.textMuted}
                          variant={TextVariant.headingSm}
                          textAlign={TextAlign.Center}
                          as="h4"
                        >
                          {t('noNFTs')}
                        </Text>
                        <ButtonLink
                          size={ButtonLinkSize.Sm}
                          href={ZENDESK_URLS.NFT_TOKENS}
                          externalLink
                        >
                          {t('learnMoreUpperCase')}
                        </ButtonLink>
                      </Box>
                    </Box>
                  )}
                </Tab>
              }
            </Tabs>
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
}
