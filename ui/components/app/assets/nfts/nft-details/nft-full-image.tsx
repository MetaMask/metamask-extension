import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
<<<<<<< HEAD:ui/components/app/nft-details/nft-full-image.tsx
import { getAssetImageURL } from '../../../helpers/utils/util';
import { getNftImageAlt } from '../../../helpers/utils/nfts';
import { getCurrentNetwork, getIpfsGateway } from '../../../selectors';
=======
import { getAssetImageURL } from '../../../../../helpers/utils/util';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { getCurrentNetwork, getIpfsGateway } from '../../../../../selectors';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-full-image.tsx

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
<<<<<<< HEAD:ui/components/app/nft-details/nft-full-image.tsx
} from '../../component-library';
import { NftItem } from '../../multichain/nft-item';
import { Content, Header, Page } from '../../multichain/pages/page';

import { getNfts } from '../../../ducks/metamask/metamask';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
=======
} from '../../../../component-library';
import { NftItem } from '../../../../multichain/nft-item';
import { Content, Header, Page } from '../../../../multichain/pages/page';

import { getNfts } from '../../../../../ducks/metamask/metamask';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-full-image.tsx
import {
  Display,
  IconColor,
  JustifyContent,
<<<<<<< HEAD:ui/components/app/nft-details/nft-full-image.tsx
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';
=======
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-full-image.tsx

export default function NftFullImage() {
  const t = useI18nContext();
  const { asset, id } = useParams<{ asset: string; id: string }>();
  const nfts = useSelector(getNfts);
  const nft = nfts.find(
    ({ address, tokenId }: { address: string; tokenId: string }) =>
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
                networkName={currentChain.nickname}
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
