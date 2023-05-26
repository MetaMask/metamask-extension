import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Text } from '../../component-library';

export default function NftDefaultImage({ name, tokenId, handleImageClick }) {
  const t = useI18nContext();
  const Tag = handleImageClick ? 'button' : 'div';
  return (
    <Tag
      tabIndex={0}
      data-testid="nft-default-image"
      className={classnames('nft-default', {
        'nft-default--clickable': handleImageClick,
      })}
      onClick={handleImageClick}
    >
      <Text variant={TextVariant.bodySm} as="h6" className="nft-default__text">
        {name ?? t('unknownCollection')} <br /> #{tokenId}
      </Text>
    </Tag>
  );
}

NftDefaultImage.propTypes = {
  /**
   * The name of the NFT collection if not supplied will default to "Unnamed collection"
   */
  name: PropTypes.string,
  /**
   * The token id of the nft
   */
  tokenId: PropTypes.string,
  /**
   * The click handler for the NFT default image
   */
  handleImageClick: PropTypes.func,
};
