import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import {
  BackgroundColor,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Text,
  Box,
  ButtonLink,
  AvatarAccount,
  AvatarAccountSize,
} from '../../component-library';

export default function NftInfo({ assetName, tokenAddress, tokenId }) {
  const t = useContext(I18nContext);
  return (
    <Box
      className="nft-info"
      display={Display.Flex}
      gap={4}
      backgroundColor={BackgroundColor.backgroundAlternative}
      padding={4}
    >
      <AvatarAccount address={tokenAddress} size={AvatarAccountSize.Md} />
      <div style={{ overflow: 'hidden' }}>
        <Text variant={TextVariant.bodySmBold} ellipsis>
          {assetName}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          ellipsis
        >
          {t('tokenId')} #{tokenId}
        </Text>
      </div>
      <ButtonLink marginLeft="auto">{t('view')}</ButtonLink>
    </Box>
  );
}

NftInfo.propTypes = {
  assetName: PropTypes.string,
  tokenAddress: PropTypes.string,
  tokenId: PropTypes.string,
};
