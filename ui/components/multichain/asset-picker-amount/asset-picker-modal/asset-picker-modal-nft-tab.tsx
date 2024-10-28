import React from 'react';
import { useSelector } from 'react-redux';
import NftsItems from '../../../app/assets/nfts/nfts-items/nfts-items';
import {
  Box,
  Text,
  ButtonLink,
  ButtonLinkSize,
} from '../../../component-library';
import {
  TextColor,
  TextVariant,
  TextAlign,
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import Spinner from '../../../ui/spinner';
import {
  getIsMainnet,
  getNftIsStillFetchingIndication,
  getUseNftDetection,
} from '../../../../selectors';
import NFTsDetectionNoticeNFTsTab from '../../../app/assets/nfts/nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import { useNftsCollections } from '../../../../hooks/useNftsCollections';
import { Collection, NFT } from './types';

type PreviouslyOwnedCollections = {
  collectionName: string;
  nfts: NFT[];
};

type AssetPickerModalNftTabProps = {
  searchQuery: string;
  onClose: () => void;
  renderSearch: () => void;
};

export function AssetPickerModalNftTab({
  searchQuery,
  onClose,
  renderSearch,
}: AssetPickerModalNftTabProps) {
  const t = useI18nContext();

  const {
    collections,
    previouslyOwnedCollection,
  }: {
    collections: Record<string, Collection>;
    previouslyOwnedCollection: PreviouslyOwnedCollections;
  } = useNftsCollections();

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

  const hasAnyNfts = Object.keys(collectionDataFiltered).length > 0;
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  if (!hasAnyNfts && nftsStillFetchingIndication) {
    return (
      <Box className="modal-tab__loading" data-testid="spinner">
        <Spinner
          color="var(--color-warning-default)"
          className="loading-overlay__spinner"
        />
      </Box>
    );
  }

  if (hasAnyNfts) {
    return (
      <Box className="modal-tab__main-view">
        {renderSearch()}
        <NftsItems
          collections={collectionDataFiltered}
          previouslyOwnedCollection={previouslyOwnedCollection}
          isModal={true}
          onCloseModal={() => onClose()}
          showTokenId={true}
          displayPreviouslyOwnedCollection={false}
        />
        {nftsStillFetchingIndication ? (
          <Box className="modal-tab__fetching">
            <Spinner
              color="var(--color-warning-default)"
              className="loading-overlay__spinner"
            />
          </Box>
        ) : null}
      </Box>
    );
  }
  return (
    <>
      {isMainnet && !useNftDetection && (
        <Box paddingTop={4} paddingInlineStart={4} paddingInlineEnd={4}>
          <NFTsDetectionNoticeNFTsTab />
        </Box>
      )}
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
          marginTop={4}
          marginBottom={12}
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
    </>
  );
}
