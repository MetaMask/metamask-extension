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
import {
  getMultichainCurrentChainId,
  getMultichainCurrentCurrency,
  getMultichainNativeCurrency,
  getMultichainNativeCurrencyImage,
  getMultichainSelectedAccountCachedBalance,
} from '../../../../selectors/multichain';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';

type AssetPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onAssetChange: (asset: Asset) => void;
  sendingAssetImage?: string;
  sendingAssetSymbol?: string;
};

const MAX_UNOWNED_TOKENS_RENDERED = 30;

export function MultichainAssetPickerModal({
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

  const chainId = useMultichainSelector(getMultichainCurrentChainId);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const nativeCurrencyImage = useMultichainSelector(
    getMultichainNativeCurrencyImage,
    selectedAccount,
  );
  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    selectedAccount,
  );
  const balanceValue = useSelector(getMultichainSelectedAccountCachedBalance);

  // TODO: add conversion for nonevm tokens
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    selectedAccount,
  );

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const usersTokens = uniqBy([], 'address');

  const memoizedUsersTokens = useEqualityCheck(usersTokens);

  const filteredTokenList = useMemo(() => {
    const nativeToken = {
      address: null,
      symbol: nativeCurrency,
      decimals: 18,
      image: nativeCurrencyImage,
      balance: balanceValue,
      type: AssetType.native,
      string: '',
    };

    const filteredTokens: Token[] = [nativeToken];

    return filteredTokens;
  }, [
    memoizedUsersTokens,
    searchQuery,
    nativeCurrency,
    nativeCurrencyImage,
    balanceValue,
    conversionRate,
    currentCurrency,
    chainId,
    sendingAssetSymbol,
  ]);

  const memoizedSwapsBlockedTokens = new Set<string>();

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
                    collectionDataFiltered={[]}
                    previouslyOwnedCollection={{ collectionName: '', nfts: [] }}
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
