import React, { useState, useCallback } from 'react';

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
import { Asset, Collection, Token } from './types';
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAssetChange = useCallback(
    (token: Token) => {
      onAssetChange(token);
      onClose();
    },
    [onAssetChange],
  );

  const defaultActiveTabKey = asset?.type === AssetType.NFT ? 'nfts' : 'tokens';

  const isDest = sendingAssetImage && sendingAssetSymbol;

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
        <Box padding={1} paddingLeft={4} paddingRight={4}>
          <TextFieldSearch
            borderRadius={BorderRadius.LG}
            placeholder={t('searchTokenOrNFT')}
            value={searchQuery}
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e: any) => handleSearch(e.target.value)}
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
        <Box style={{ flexGrow: '1' }}>
          {isDest ? (
            <AssetList
              handleAssetChange={handleAssetChange}
              searchQuery={searchQuery}
              asset={asset}
            />
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
                  <AssetList
                    handleAssetChange={handleAssetChange}
                    searchQuery={searchQuery}
                    asset={asset}
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
