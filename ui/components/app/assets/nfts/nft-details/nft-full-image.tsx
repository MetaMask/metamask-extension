// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { getNftImage, getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { getCurrentNetwork, getIpfsGateway } from '../../../../../selectors';

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import { NftItem } from '../../../../multichain/nft-item';
import { Content, Header, Page } from '../../../../multichain/pages/page';

import { getNfts } from '../../../../../ducks/metamask/metamask';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';
import useFetchNftDetailsFromTokenURI from '../../../../../hooks/useFetchNftDetailsFromTokenURI';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isWebUrl } from '../../../../../../app/scripts/lib/util';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NftFullImage() {
  const t = useI18nContext();
  const { asset, id } = useParams<{ asset: string; id: string }>();
  const nfts = useSelector(getNfts);
  const nft = nfts.find(
    ({ address, tokenId }: { address: string; tokenId: string }) =>
      // @ts-expect-error TODO: Fix this type error by handling undefined parameters
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  const { image: _image, imageOriginal, tokenURI, name, tokenId } = nft;
  const { image: imageFromTokenURI } = useFetchNftDetailsFromTokenURI(tokenURI);
  const image = getNftImage(_image);

  const ipfsGateway = useSelector(getIpfsGateway);
  const currentChain = useSelector(getCurrentNetwork);
  const nftImageURL = useGetAssetImageUrl(imageOriginal ?? image, ipfsGateway);

  const nftImageAlt = getNftImageAlt(nft);
  const nftSrcUrl = imageOriginal ?? image;
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const isImageHosted =
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (image && isWebUrl(image)) ||
    (imageFromTokenURI && isWebUrl(imageFromTokenURI));
  const history = useHistory();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

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
              onClick={() => history.push(`${ASSET_ROUTE}/${asset}/${id}`)}
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
                // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                src={isImageHosted ? image || imageFromTokenURI : nftImageURL}
                alt={nftImageAlt}
                name={name}
                tokenId={tokenId}
                networkName={currentChain.nickname ?? ''}
                networkSrc={currentChain.rpcPrefs?.imageUrl}
                isIpfsURL={isIpfsURL}
              />
            </Box>
          </Box>
        </Content>
      </Page>
    </Box>
  );
}
