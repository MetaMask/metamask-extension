import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Typography from '../../ui/typography';
import { TypographyVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function CollectibleDefaultImage({
  name,
  tokenId,
  handleImageClick,
}) {
  const t = useI18nContext();
  const Tag = handleImageClick ? 'button' : 'div';
  return (
    <Tag
      tabIndex={0}
      data-testid="collectible-default-image"
      className={classnames('collectible-default', {
        'collectible-default--clickable': handleImageClick,
      })}
      onClick={handleImageClick}
    >
      <Typography
        variant={TypographyVariant.H6}
        className="collectible-default__text"
      >
        {name ?? t('unknownCollection')} <br /> #{tokenId}
      </Typography>
    </Tag>
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
};
