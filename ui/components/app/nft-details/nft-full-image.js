import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { getAssetImageURL } from '../../../helpers/utils/util';
import { getNftImageAlt } from '../../../helpers/utils/nfts';
import { getCurrentNetwork, getIpfsGateway } from '../../../selectors';

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../component-library';
import { NftItem } from '../../multichain/nft-item';
import { Content, Page } from '../../multichain/pages/page';

import { getNfts } from '../../../ducks/metamask/metamask';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';

export default function NftFullImage() {
  const t = useI18nContext();
  const { asset, id } = useParams();
  const nfts = useSelector(getNfts);
  const nft = nfts.find(
    ({ address, tokenId }) =>
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  const { image, imageOriginal, name, tokenId } = nft;

  const ipfsGateway = useSelector(getIpfsGateway);
  const currentChain = useSelector(getCurrentNetwork);

  const nftImageAlt = getNftImageAlt(nft);
  const nftSrcUrl = imageOriginal ?? image;
  const nftImageURL = getAssetImageURL(imageOriginal ?? image, ipfsGateway);
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const isImageHosted = image?.startsWith('https:');
  const history = useHistory();

  return (
    <div className="main-container asset__container">
      <Page>
        <Content>
          <Box
            display={Display.Flex}
            paddingBottom={4}
            justifyContent={JustifyContent.flexEnd}
          >
            <ButtonIcon
              color={IconColor.iconAlternative}
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              iconName={IconName.Close}
              onClick={() => history.push(`${ASSET_ROUTE}/${asset}/${id}`)}
              data-testid="nft-details__close"
              paddingLeft={0}
            />
          </Box>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            paddingTop={4}
            className="nft-details__full-image-container"
          >
            <Box className=" nft-details__nft-item-full-image">
              <NftItem
                nftImageURL={nftImageURL}
                src={isImageHosted ? image : nftImageURL}
                alt={image ? nftImageAlt : ''}
                name={name}
                tokenId={tokenId}
                networkName={currentChain.nickname}
                networkSrc={currentChain.rpcPrefs?.imageUrl}
                isIpfsURL={isIpfsURL}
              />
            </Box>
          </Box>
        </Content>
      </Page>
    </div>
  );
}
