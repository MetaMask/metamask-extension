import React from 'react';
import PropTypes from 'prop-types';
import { Box, TagUrl } from '../../component-library';
import { BlockSize } from '../../../helpers/constants/design-system';

export const ConnectedSitePermissionsPill = ({
  actionButtonLabel,
  siteName,
  siteIcon,
}) => {
  return (
    <Box width={BlockSize.Half}>
      <TagUrl
        actionButtonLabel={actionButtonLabel}
        label={siteName}
        src={siteIcon}
        showLockIcon
      />
    </Box>
  );
};

ConnectedSitePermissionsPill.propTypes = {
  actionButtonLabel: PropTypes.string.isRequired,
  siteName: PropTypes.string.isRequired,
  siteIcon: PropTypes.string.isRequired,
};
