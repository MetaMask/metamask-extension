import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useNavigationType } from 'react-router-dom-v5-compat';
import { Nft } from '@metamask/assets-controllers';
import { toHex } from '@metamask/controller-utils';
import { getNftImage, getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { getIpfsGateway } from '../../../../../selectors';

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import { NftItem } from '../../../../multichain/nft-item';
import { Content, Header, Page } from '../../../../multichain/pages/page';

import { getAllNfts } from '../../../../../ducks/metamask/metamask';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';
import useFetchNftDetailsFromTokenURI from '../../../../../hooks/useFetchNftDetailsFromTokenURI';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isWebUrl } from '../../../../../../app/scripts/lib/util';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../../../selectors/multichain';
import {
  ASSET_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../../../helpers/constants/routes';

type NftFullImageProps = {
  params?: {
    asset?: string;
    id?: string;
  };
};

/**
 * Component displaying full NFT image
 *
 * @param options0 - Component props
 * @param options0.params - Route parameters including asset and id
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NftFullImage({ params }: NftFullImageProps) {
  const t = useI18nContext();
  const { asset, id } = params ?? {};
  const allNfts = useSelector(getAllNfts);
  const nfts = Object.values(allNfts).flat() as Nft[];
  const nft = nfts.find(
    ({ address, tokenId }: { address: string; tokenId: string }) =>
      // @ts-expect-error TODO: Fix this type error by handling undefined parameters
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  const {
    image: _image,
    imageOriginal,
    tokenURI,
    name,
    tokenId,
    chainId,
    description,
  } = nft as Nft;
  const { image: imageFromTokenURI } = useFetchNftDetailsFromTokenURI(tokenURI);
  const image = getNftImage(_image);

  const ipfsGateway = useSelector(getIpfsGateway);
  const nftNetworkConfigs = useSelector(getNetworkConfigurationsByChainId);
  const hexChainId = toHex(chainId?.toString() ?? '');
  const nftChainNetwork = nftNetworkConfigs[hexChainId];
  const nftChainImage = getImageForChainId(hexChainId);
  const nftImageURL = useGetAssetImageUrl(imageOriginal ?? image, ipfsGateway);

  const nftImageAlt = getNftImageAlt({
    name,
    tokenId,
    description,
  });
  const nftSrcUrl = imageOriginal ?? image;
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');

  const isImageHosted =
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (image && isWebUrl(image)) ||
    (imageFromTokenURI && isWebUrl(imageFromTokenURI));
  const navigationType = useNavigationType();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const onClose = useCallback(() => {
    if (navigationType === 'PUSH') {
      // Previous navigation was a PUSH, so safe to go back
      navigate(PREVIOUS_ROUTE);
    } else {
      // Fallback: go to the asset details route explicitly
      navigate(`${ASSET_ROUTE}/${hexChainId}/${asset}/${id}`, {
        replace: true,
      });
    }
  }, [asset, hexChainId, id, navigate, navigationType]);

  return (
    <Box className="main-container asset__container">
      <Page>
        <Header
          endAccessory={
            <ButtonIcon
              color={IconColor.iconAlternative}
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              iconName={IconName.Close}
              onClick={onClose}
              data-testid="nft-details__close"
              paddingLeft={0}
            />
          }
        />
        <Content
          className={`fade-in ${visible ? 'visible' : ''}`}
          justifyContent={JustifyContent.center}
        >
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            paddingBottom={12}
          >
            <Box>
              <NftItem
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                src={isImageHosted ? image || imageFromTokenURI : nftImageURL}
                alt={nftImageAlt}
                name={name ?? ''}
                tokenId={tokenId}
                networkName={nftChainNetwork?.name ?? ''}
                networkSrc={nftChainImage}
                isIpfsURL={isIpfsURL}
              />
            </Box>
          </Box>
        </Content>
      </Page>
    </Box>
  );
}
