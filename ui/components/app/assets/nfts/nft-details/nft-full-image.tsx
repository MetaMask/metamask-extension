import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

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
import { getCurrentChainId } from '../../../../../selectors';

export default function NftFullImage() {
  const t = useI18nContext();
  const { asset, id } = useParams<{ asset: string; id: string }>();
  const nfts = useSelector(getNfts);
  const nft = nfts.find(
    ({ address, tokenId }: { address: string; tokenId: string }) =>
      // @ts-expect-error TODO: Fix this type error by handling undefined parameters
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  // TODO: Remove this when NFTs have a native chainId on their objects
  const chainId = useSelector(getCurrentChainId);

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
                nft={{ ...nft, chainId }}
                badgeWrapperClassname="badge-wrapper"
              />
            </Box>
          </Box>
        </Content>
      </Page>
    </Box>
  );
}
