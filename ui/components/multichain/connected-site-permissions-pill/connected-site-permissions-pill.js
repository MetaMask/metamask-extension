import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { TagUrl } from '../../component-library';
import { showSitePermissionsModal } from './connected-site-permissions-pill-actions';

export const ConnectedSitePermissionsPill = ({
  actionButtonLabel,
  siteName,
  siteIcon,
}) => {
  const dispatch = useDispatch();
  return (
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
  );
};

ConnectedSitePermissionsPill.propTypes = {
  actionButtonLabel: PropTypes.string,
  siteName: PropTypes.string.isRequired,
  siteIcon: PropTypes.string.isRequired,
};
