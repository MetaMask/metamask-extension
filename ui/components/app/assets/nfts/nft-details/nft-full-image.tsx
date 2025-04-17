import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { Nft } from '@metamask/assets-controllers';
import { toHex } from '@metamask/controller-utils';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
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
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../../../selectors/multichain';

export default function NftFullImage() {
  const t = useI18nContext();
  const { asset, id } = useParams<{ asset: string; id: string }>();

  const allNfts = useSelector(getAllNfts);
  const nfts = Object.values(allNfts).flat() as Nft[];
  const nft = nfts.find(
    ({ address, tokenId }: { address: string; tokenId: string }) =>
      // @ts-expect-error TODO: Fix this type error by handling undefined parameters
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  const { image, imageOriginal, name, tokenId, chainId, description } =
    nft as Nft;

  const ipfsGateway = useSelector(getIpfsGateway);
  const nftNetworkConfigs = useSelector(getNetworkConfigurationsByChainId);
  const nftChainNetwork = nftNetworkConfigs[toHex(chainId?.toString() ?? '')];
  const nftChainImage = getImageForChainId(toHex(chainId?.toString() ?? ''));
  const nftImageURL = useGetAssetImageUrl(
    imageOriginal ?? (image || undefined),
    ipfsGateway,
  );

  const nftImageAlt = getNftImageAlt({
    name,
    tokenId,
    description,
  });
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
            paddingBottom={12}
          >
            <Box>
              <NftItem
                src={isImageHosted ? image || undefined : nftImageURL}
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
