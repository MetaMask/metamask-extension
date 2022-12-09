import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Typography from '../../ui/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function NftDefaultImage({ name, tokenId, handleImageClick }) {
  const t = useI18nContext();
  return (
    <div
      className={classnames('nft-default', {
        'nft-default--clickable': handleImageClick,
      })}
      onClick={handleImageClick}
    >
      <Typography variant={TYPOGRAPHY.H6} className="nft-default__text">
        {name ?? t('unknownCollection')} <br /> #{tokenId}
      </Typography>
    </div>
  );
}

NftDefaultImage.propTypes = {
  /**
   * The name of the nft collection if not supplied will default to "Unnamed collection"
   */
  name: PropTypes.string,
  /**
   * The token id of the nft
   */
  tokenId: PropTypes.string,
  /**
   * The click handler for the nft default image
   */
  handleImageClick: PropTypes.func,
};
