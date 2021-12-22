import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/ui/button';
import Typography from '../../../../../components/ui/typography';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  TYPOGRAPHY,
  COLORS,
} from '../../../../../helpers/constants/design-system';
import SnapsAuthorshipPill from '../../../../../components/app/flask/snaps-authorship-pill';
import Box from '../../../../../components/ui/box';
import ToggleButton from '../../../../../components/ui/toggle-button';
import PermissionsConnectPermissionList from '../../../../../components/app/permissions-connect-permission-list/permissions-connect-permission-list';
import ConnectedSitesList from '../../../../../components/app/connected-sites-list';
import Tooltip from '../../../../../components/ui/tooltip';

function ViewSnap({
  snap,
  onRemove,
  onToggle,
  connectedSubjects,
  onDisconnect,
}) {
  const t = useI18nContext();

  return (
    <div className="view-snap">
      <div className="settings-page__content-row">
        <div className="view-snap__subheader">
          <Typography
            className="view-snap__title"
            variant={TYPOGRAPHY.H3}
            boxProps={{ textAlign: 'center' }}
          >
            {snap.manifest.proposedName}
          </Typography>
          <Box className="view-snap__pill-toggle-container">
            <Box className="view-snap__pill-container" paddingLeft={2}>
              <SnapsAuthorshipPill
                packageName={snap.id}
                url={snap.manifest.repository?.url}
              />
            </Box>
            <Box
              paddingLeft={4}
              className="snap-settings-card__toggle-container view-snap__toggle-container"
            >
              <Tooltip interactive position="bottom" html={t('snapsToggle')}>
                <ToggleButton
                  value={snap.enabled}
                  onToggle={onToggle}
                  className="snap-settings-card__toggle-container__toggle-button"
                />
              </Tooltip>
            </Box>
          </Box>
        </div>
        <Box className="view-snap__content-container" width="7/12">
          <div className="settings-page__content-item view-snap__section">
            <Typography
              variant={TYPOGRAPHY.H6}
              color={COLORS.UI4}
              boxProps={{ marginTop: 5 }}
            >
              {snap.manifest.description}
            </Typography>
          </div>
          <div className="settings-page__content-item view-snap__section view-snap__permission-list">
            <Typography variant={TYPOGRAPHY.H4}>{t('permissions')}</Typography>
            <Typography variant={TYPOGRAPHY.H6} color={COLORS.UI4}>
              {t('snapAccess', [snap.manifest.proposedName])}
            </Typography>
            <Box width="10/12">
              <PermissionsConnectPermissionList
                permissions={snap.manifest.initialPermissions}
              />
            </Box>
          </div>
          <div className="settings-page__content-item view-snap__section">
            <Box width="11/12">
              <Typography variant={TYPOGRAPHY.H4}>
                {t('connectedSites')}
              </Typography>
              <Typography variant={TYPOGRAPHY.H6} color={COLORS.UI4}>
                {t('connectedSnapSites', [snap.manifest.proposedName])}
              </Typography>
              <ConnectedSitesList
                connectedSubjects={connectedSubjects}
                onDisconnect={(origin) => {
                  onDisconnect(origin, snap.permissionName);
                }}
              />
            </Box>
          </div>
          <div className="settings-page__content-item">
            <Typography variant={TYPOGRAPHY.H4}>{t('removeSnap')}</Typography>
            <Typography
              variant={TYPOGRAPHY.H6}
              color={COLORS.UI4}
              boxProps={{ paddingBottom: 3 }}
            >
              {t('removeSnapDescription')}
            </Typography>
            <Button
              className="view-snap__remove__button"
              type="danger"
              css={{
                maxWidth: '175px',
              }}
              onClick={onRemove}
            >
              {t('removeSnap')}
            </Button>
          </div>
        </Box>
      </div>
    </div>
  );
}

ViewSnap.propTypes = {
  snap: PropTypes.object,
  onRemove: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  connectedSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      iconUrl: PropTypes.string,
      origin: PropTypes.string,
    }),
  ).isRequired,
  onDisconnect: PropTypes.func.isRequired,
};

export default React.memo(ViewSnap);
