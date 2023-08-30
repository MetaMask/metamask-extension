import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Box, TagUrl } from '../../component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import { showSitePermissionsModal } from './connected-site-permissions-pill-actions';

export const ConnectedSitePermissionsPill = ({
  actionButtonLabel,
  siteName,
  siteIcon,
}) => {
  const dispatch = useDispatch();
  return (
    <Box width={BlockSize.Min}>
      <TagUrl
        actionButtonLabel={actionButtonLabel || null}
        label={siteName}
        src={siteIcon}
        showLockIcon
        actionButtonProps={{
          as: 'button',
          onClick: () => dispatch(showSitePermissionsModal()),
        }}
      />
    </Box>
  );
};

ConnectedSitePermissionsPill.propTypes = {
  actionButtonLabel: PropTypes.string,
  siteName: PropTypes.string.isRequired,
  siteIcon: PropTypes.string.isRequired,
};
