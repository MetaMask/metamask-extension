import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../../components/ui/button';
import Typography from '../../../../components/ui/typography';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  TYPOGRAPHY,
  COLORS,
  TEXT_ALIGN,
  FRACTIONS,
} from '../../../../helpers/constants/design-system';
import SnapsAuthorshipPill from '../../../../components/app/flask/snaps-authorship-pill';
import Box from '../../../../components/ui/box';
import SnapRemoveWarning from '../../../../components/app/flask/snap-remove-warning';
import ToggleButton from '../../../../components/ui/toggle-button';
import PermissionsConnectPermissionList from '../../../../components/app/permissions-connect-permission-list/permissions-connect-permission-list';
import ConnectedSitesList from '../../../../components/app/connected-sites-list';
import Tooltip from '../../../../components/ui/tooltip';
import { SNAPS_LIST_ROUTE } from '../../../../helpers/constants/routes';
import {
  disableSnap,
  enableSnap,
  removeSnap,
  removePermissionsFor,
} from '../../../../store/actions';
import { getSnaps, getSubjectsWithPermission } from '../../../../selectors';
import { formatDate } from '../../../../helpers/utils/util';

function ViewSnap() {
  const t = useI18nContext();
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  // The snap ID is in URI-encoded form in the last path segment of the URL.
  const decodedSnapId = decodeURIComponent(pathname.match(/[^/]+$/u)[0]);
  const snaps = useSelector(getSnaps);
  const snap = Object.entries(snaps)
    .map(([_, snapState]) => snapState)
    .find((snapState) => snapState.id === decodedSnapId);

  const [isShowingRemoveWarning, setIsShowingRemoveWarning] = useState(false);

  useEffect(() => {
    if (!snap) {
      history.push(SNAPS_LIST_ROUTE);
    }
  }, [history, snap]);

  const connectedSubjects = useSelector((state) =>
    getSubjectsWithPermission(state, snap?.permissionName),
  );
  const dispatch = useDispatch();
  const onDisconnect = (connectedOrigin, snapPermissionName) => {
    dispatch(
      removePermissionsFor({
        [connectedOrigin]: [snapPermissionName],
      }),
    );
  };
  const onToggle = () => {
    if (snap.enabled) {
      dispatch(disableSnap(snap.id));
    } else {
      dispatch(enableSnap(snap.id));
    }
  };

  if (!snap) {
    return null;
  }

  const versionHistory = snap.versionHistory ?? [];
  const [firstInstall] = versionHistory;

  return (
    <div className="view-snap">
      <div className="settings-page__content-row">
        <div className="view-snap__subheader">
          <Typography
            className="view-snap__title"
            variant={TYPOGRAPHY.H3}
            boxProps={{ textAlign: TEXT_ALIGN.CENTER }}
          >
            {snap.manifest.proposedName}
          </Typography>
          <Box className="view-snap__pill-toggle-container">
            <Box className="view-snap__pill-container" paddingLeft={2}>
              <SnapsAuthorshipPill snapId={snap.id} />
            </Box>
            <Box paddingLeft={4} className="view-snap__toggle-container">
              <Tooltip interactive position="bottom" html={t('snapsToggle')}>
                <ToggleButton
                  value={snap.enabled}
                  onToggle={onToggle}
                  className="view-snap__toggle-button"
                />
              </Tooltip>
            </Box>
          </Box>
        </div>
        <Box
          className="view-snap__install-details"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding={2}
        >
          {firstInstall && (
            <Typography variant={TYPOGRAPHY.H8}>
              {t('snapAdded', [
                formatDate(firstInstall.date, 'MMMM d, y'),
                firstInstall.origin,
              ])}
            </Typography>
          )}
          <Typography className="view-snap__version" variant={TYPOGRAPHY.H7}>
            {t('shorthandVersion', [snap.version])}
          </Typography>
        </Box>
        <Box
          className="view-snap__content-container"
          width={FRACTIONS.SEVEN_TWELFTHS}
        >
          <div className="view-snap__section">
            <Typography
              variant={TYPOGRAPHY.H6}
              color={COLORS.TEXT_ALTERNATIVE}
              boxProps={{ marginTop: 5 }}
            >
              {snap.manifest.description}
            </Typography>
          </div>
          <div className="view-snap__section view-snap__permission-list">
            <Typography variant={TYPOGRAPHY.H4}>{t('permissions')}</Typography>
            <Typography variant={TYPOGRAPHY.H6} color={COLORS.TEXT_ALTERNATIVE}>
              {t('snapAccess', [snap.manifest.proposedName])}
            </Typography>
            <Box width={FRACTIONS.TEN_TWELFTHS}>
              <PermissionsConnectPermissionList
                permissions={snap.manifest.initialPermissions}
              />
            </Box>
          </div>
          <div className="view-snap__section">
            <Box width="11/12">
              <Typography variant={TYPOGRAPHY.H4}>
                {t('connectedSites')}
              </Typography>
              <Typography
                variant={TYPOGRAPHY.H6}
                color={COLORS.TEXT_ALTERNATIVE}
              >
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
          <div className="view-snap__section">
            <Typography variant={TYPOGRAPHY.H4}>{t('removeSnap')}</Typography>
            <Typography
              variant={TYPOGRAPHY.H6}
              color={COLORS.TEXT_ALTERNATIVE}
              boxProps={{ paddingBottom: 3 }}
            >
              {t('removeSnapDescription')}
            </Typography>
            <Button
              className="view-snap__remove-button"
              type="danger"
              css={{
                maxWidth: '175px',
              }}
              onClick={() => setIsShowingRemoveWarning(true)}
            >
              {t('removeSnap')}
            </Button>
            {isShowingRemoveWarning && (
              <SnapRemoveWarning
                onCancel={() => setIsShowingRemoveWarning(false)}
                onSubmit={async () => {
                  await dispatch(removeSnap(snap.id));
                }}
                snapName={snap.manifest.proposedName}
              />
            )}
          </div>
        </Box>
      </div>
    </div>
  );
}

export default React.memo(ViewSnap);
