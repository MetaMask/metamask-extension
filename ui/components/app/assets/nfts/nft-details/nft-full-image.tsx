import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
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

type Params = { asset: string; id: string };

export default function NftFullImage() {
  const t = useI18nContext();
  const { asset, id } = useParams<Params>() as Params;
  const nfts = useSelector(getNfts);
  const nft = nfts.find(
    ({ address, tokenId }: { address: string; tokenId: string }) =>
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  const { image, imageOriginal, name, tokenId } = nft;

  const ipfsGateway = useSelector(getIpfsGateway);
  const currentChain = useSelector(getCurrentNetwork);
  const nftImageURL = useGetAssetImageUrl(imageOriginal ?? image, ipfsGateway);

  const nftImageAlt = getNftImageAlt(nft);
  const nftSrcUrl = imageOriginal ?? image;
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const isImageHosted = image?.startsWith('https:');
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
            paddingTop={4}
          >
            <Box>
              <NftItem
                src={isImageHosted ? image : nftImageURL}
                alt={image ? nftImageAlt : ''}
                name={name}
                tokenId={tokenId}
                networkName={currentChain.nickname ?? ''}
                networkSrc={currentChain.rpcPrefs?.imageUrl}
                isIpfsURL={isIpfsURL}
                badgeWrapperClassname="badge-wrapper"
              />
            </Box>
          </Box>
        </Content>
      </Page>
    </Box>
  );
}
