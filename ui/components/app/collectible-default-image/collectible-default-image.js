import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Typography from '../../ui/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function CollectibleDefaultImage({
  name,
  tokenId,
  handleImageClick,
  handleImageKeyPress,
}) {
  const t = useI18nContext();
  return (
    <div
      tabIndex={0}
      className={classnames('collectible-default', {
        'collectible-default--clickable': handleImageClick,
      })}
      onClick={handleImageClick}
      onKeyPress={handleImageKeyPress}
    >
      <Typography variant={TYPOGRAPHY.H6} className="collectible-default__text">
        {name ?? t('unknownCollection')} <br /> #{tokenId}
      </Typography>
    </div>
  );
}

CollectibleDefaultImage.propTypes = {
  /**
   * The name of the collectible collection if not supplied will default to "Unnamed collection"
   */
  name: PropTypes.string,
  /**
   * The token id of the collectible
   */
  tokenId: PropTypes.string,
  /**
   * The click handler for the collectible default image
   */
  handleImageClick: PropTypes.func,
  /**
   * The key press handler for the collectible default image
   */
  handleImageKeyPress: PropTypes.func,
};
