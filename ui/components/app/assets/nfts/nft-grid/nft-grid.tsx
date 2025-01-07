import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  IconName,
} from '../../../../component-library';
import Spinner from '../../../../ui/spinner';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { NftItem } from '../../../../multichain/nft-item';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { showImportNftsModal } from '../../../../../store/actions';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import {
  getCurrentNetwork,
  getIsMainnet,
  getNftIsStillFetchingIndication,
  getUseNftDetection,
} from '../../../../../selectors';
import { useDispatch, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export default function NftGrid({
  currentlyOwnedNfts,
}: {
  currentlyOwnedNfts: NFT[];
}) {
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();

  const currentChain = useSelector(getCurrentNetwork) as {
    chainId: Hex;
    nickname: string;
    rpcPrefs?: { imageUrl: string };
  };
  const isMainnet = useSelector(getIsMainnet);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );
  const useNftDetection = useSelector(getUseNftDetection);

  const { nftsLoading, collections, previouslyOwnedCollection } =
    useNftsCollections();

  return (
    <Box display={Display.Grid} gap={4} className="nft-items__wrapper">
      {currentlyOwnedNfts.map((nft: NFT) => {
        const handleImageClick = () => {
          // if (isModal) {
          //   return onSendNft(nft);
          // }
          return history.push(
            `${ASSET_ROUTE}/${currentChain.chainId}/${nft.address}/${nft.tokenId}`,
          );
        };
        const { image, imageOriginal, tokenURI } = nft;
        const nftImageAlt = getNftImageAlt(nft);

        const isIpfsURL = (imageOriginal ?? image ?? tokenURI)?.startsWith(
          'ipfs:',
        );
        return (
          <Box
            data-testid="nft-wrapper"
            key={tokenURI}
            className="nft-items__image-wrapper"
          >
            <NftItem
              nft={nft}
              alt={nftImageAlt}
              src={image ?? ''}
              networkName={currentChain.nickname}
              networkSrc={currentChain.rpcPrefs?.imageUrl}
              onClick={handleImageClick}
              isIpfsURL={isIpfsURL}
              clickable
            />
          </Box>
        );
      })}

      {nftsStillFetchingIndication ? (
        <Box className="nfts-tab__fetching">
          <Spinner
            color="var(--color-warning-default)"
            className="loading-overlay__spinner"
          />
        </Box>
      ) : null}
      <Box
        className="nfts-tab__buttons"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        margin={4}
        gap={2}
        marginBottom={2}
      >
        <ButtonLink
          size={ButtonLinkSize.Md}
          data-testid="import-nft-button"
          startIconName={IconName.Add}
          onClick={() => {
            dispatch(showImportNftsModal({}));
          }}
        >
          {t('importNFT')}
        </ButtonLink>
        {!isMainnet && Object.keys(collections).length < 1 ? null : (
          <>
            <Box
              className="nfts-tab__link"
              justifyContent={JustifyContent.flexEnd}
            >
              {isMainnet && !useNftDetection ? (
                <ButtonLink
                  size={ButtonLinkSize.Md}
                  startIconName={IconName.Setting}
                  data-testid="refresh-list-button"
                  // onClick={onEnableAutoDetect}
                  onClick={() => console.log('enable autodetect')}
                >
                  {t('enableAutoDetect')}
                </ButtonLink>
              ) : (
                <ButtonLink
                  size={ButtonLinkSize.Md}
                  startIconName={IconName.Refresh}
                  data-testid="refresh-list-button"
                  // onClick={onRefresh}
                  onClick={() => console.log('refresh list')}
                >
                  {t('refreshList')}
                </ButtonLink>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
