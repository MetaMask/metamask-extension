import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import classnames from 'classnames';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function CollectibleDefaultImage({
  name,
  tokenId,
  handleImageClick,
}) {
  const t = useI18nContext();
  return (
    <div
      className={classnames('collectible-default__wrapper', {
        'collectible-default__clickable': handleImageClick,
      })}
      onClick={handleImageClick}
    >
      <img className="collectible-default__image" src="images/empty-nft.png" />
      <Typography
        variant={TYPOGRAPHY.H7}
        className={classnames('collectible-default__text', {
          'collectible-default__clickable': handleImageClick,
        })}
        onClick={handleImageClick}
      >
        {name ?? t('unknownCollection')} #{tokenId}
      </Typography>
    </div>
  );
}

CollectibleDefaultImage.propTypes = {
  name: PropTypes.string,
  tokenId: PropTypes.string,
  handleImageClick: PropTypes.func,
};
