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
      className={classnames('collectible-default', {
        'collectible-default--clickable': handleImageClick,
      })}
      onClick={handleImageClick}
    >
      <Typography variant={TYPOGRAPHY.H7} className="collectible-default__text">
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
