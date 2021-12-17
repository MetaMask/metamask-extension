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

function ViewSnap({ snap, onRemove, onToggle }) {
  const t = useI18nContext();

  return (
    <div className="settings-page__content-row">
      <div className="settings-page__subheader view-snap-subheader">
        <Typography variant={TYPOGRAPHY.H3}>{snap.name}</Typography>
        <Box paddingLeft={2}>
          <SnapsAuthorshipPill packageName={snap.name} url={snap.name} />
        </Box>
        <Box paddingLeft={4} className="snap-settings-card__toggle-container">
          <ToggleButton
            value={snap.enabled}
            onToggle={onToggle}
            className="snap-settings-card__toggle-container__toggle-button"
          />
        </Box>
      </div>
      <Box className="view-snap-content-container" width="7/12">
        <div className="settings-page__content-item view-snap-section">
          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.UI4}
            boxProps={{ marginTop: 6 }}
          >
            {snap.description}
          </Typography>
        </div>
        <div className="settings-page__content-item view-snap-section snap-permission-list">
          <Typography variant={TYPOGRAPHY.H4}>{t('permissions')}</Typography>
          <Typography variant={TYPOGRAPHY.H6} color={COLORS.UI4}>
            {t('snapAccess', [snap.name])}
          </Typography>
          <Box width="10/12">
            <PermissionsConnectPermissionList
              permissions={snap.initialPermissions}
            />
          </Box>
        </div>
        <div className="settings-page__content-item view-snap-section">
          <Typography variant={TYPOGRAPHY.H4}>{t('connectedSites')}</Typography>
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
  );
}

ViewSnap.propTypes = {
  snap: PropTypes.object,
  onRemove: PropTypes.func,
  onToggle: PropTypes.func,
};

export default React.memo(ViewSnap);
