import React, { FC } from 'react';
import { useDispatch } from 'react-redux';
import { TagUrl } from '../../component-library';
import { showSitePermissionsModal } from './connected-site-permissions-pill-actions';

interface ConnectedSitePermissionsPillProps {
  actionButtonLabel?: string;
  siteName: string;
  siteIcon: string;
}

export const ConnectedSitePermissionsPill: FC<
  ConnectedSitePermissionsPillProps
> = ({ actionButtonLabel, siteName, siteIcon }) => {
  const dispatch = useDispatch();
  return (
    <TagUrl
      className="connected-site-permissions-pill"
      actionButtonLabel={actionButtonLabel || null}
      label={siteName}
      labelProps={{ ellipsis: true }}
      src={siteIcon}
      showLockIcon
      actionButtonProps={{
        as: 'button',
        onClick: () => dispatch(showSitePermissionsModal()),
      }}
    />
  );
};
