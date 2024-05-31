import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import NftsItems from '../../../app/nfts-items/nfts-items';
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
import { TokenStandard } from '../../../../../shared/constants/transaction';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import Spinner from '../../../ui/spinner';
import { getIsStillNftsFetching } from '../../../../ducks/metamask/metamask';

type NFT = {
  address: string;
  description: string | null;
  favorite: boolean;
  image: string | null;
  isCurrentlyOwned: boolean;
  name: string | null;
  standard: TokenStandard;
  tokenId: string;
  tokenURI?: string;
};

type Collection = {
  collectionName: string;
  collectionImage: string | null;
  nfts: NFT[];
};

type PreviouslyOwnedCollections = {
  collectionName: string;
  nfts: NFT[];
};

type AssetPickerModalNftTabProps = {
  collectionDataFiltered: Collection[];
  previouslyOwnedCollection: PreviouslyOwnedCollections;
  onClose: () => void;
  renderSearch: () => void;
};

export function AssetPickerModalNftTab({
  collectionDataFiltered,
  previouslyOwnedCollection,
  onClose,
  renderSearch,
}: AssetPickerModalNftTabProps) {
  const t = useI18nContext();

  const hasAnyNfts = Object.keys(collectionDataFiltered).length > 0;
  const isNftsStillFetched = useSelector(getIsStillNftsFetching);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Use setTimeout to update the message after 2000 milliseconds (2 seconds)
    const timeoutId = setTimeout(() => {
      setShowLoader(false);
    }, 3000);

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array ensures the effect runs only once

  if (!hasAnyNfts && showLoader) {
    return (
      <Box className="modal-tab__loading">
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
        {isNftsStillFetched.isFetchingInProgress ? (
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
  );
}
