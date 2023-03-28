import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/rpc-methods';
import Button from '../../../../components/ui/button';
import Typography from '../../../../components/ui/typography';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  TypographyVariant,
  TEXT_ALIGN,
  FRACTIONS,
  TextColor,
} from '../../../../helpers/constants/design-system';
import SnapAuthorship from '../../../../components/app/flask/snap-authorship';
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
  updateCaveat,
} from '../../../../store/actions';
import {
  getSnaps,
  getSubjectsWithSnapPermission,
  getPermissions,
  getPermissionSubjects,
} from '../../../../selectors';
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
    getSubjectsWithSnapPermission(state, snap?.id),
  );
  const permissions = useSelector(
    (state) => snap && getPermissions(state, snap.id),
  );
  const subjects = useSelector((state) => getPermissionSubjects(state));
  const dispatch = useDispatch();

  const onToggle = () => {
    if (snap.enabled) {
      dispatch(disableSnap(snap.id));
    } else {
      dispatch(enableSnap(snap.id));
    }
  };

  const onDisconnect = (connectedOrigin, snapId) => {
    const caveatValue =
      subjects[connectedOrigin].permissions[WALLET_SNAP_PERMISSION_KEY]
        .caveats[0].value;
    const newCaveatValue = { ...caveatValue };
    delete newCaveatValue[snapId];
    if (Object.keys(newCaveatValue) > 0) {
      dispatch(
        updateCaveat(
          connectedOrigin,
          WALLET_SNAP_PERMISSION_KEY,
          SnapCaveatType.SnapIds,
          newCaveatValue,
        ),
      );
    } else {
      dispatch(
        removePermissionsFor({
          [connectedOrigin]: [WALLET_SNAP_PERMISSION_KEY],
        }),
      );
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
            variant={TypographyVariant.H3}
            boxProps={{ textAlign: TEXT_ALIGN.CENTER }}
          >
            {snap.manifest.proposedName}
          </Typography>
          <Box className="view-snap__pill-toggle-container">
            <Box className="view-snap__pill-container" paddingLeft={2}>
              <SnapAuthorship snapId={snap.id} />
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
            <Typography variant={TypographyVariant.H8}>
              {t('snapAdded', [
                formatDate(firstInstall.date, 'MMMM d, y'),
                firstInstall.origin,
              ])}
            </Typography>
          )}
          <Typography
            className="view-snap__version"
            variant={TypographyVariant.H7}
          >
            {t('shorthandVersion', [snap.version])}
          </Typography>
        </Box>
        <Box
          className="view-snap__content-container"
          width={FRACTIONS.SEVEN_TWELFTHS}
        >
          <div className="view-snap__section">
            <Typography
              variant={TypographyVariant.H6}
              color={TextColor.textAlternative}
              boxProps={{ marginTop: 5 }}
            >
              {snap.manifest.description}
            </Typography>
          </div>
          <div className="view-snap__section view-snap__permission-list">
            <Typography variant={TypographyVariant.H4}>
              {t('permissions')}
            </Typography>
            <Typography
              variant={TypographyVariant.H6}
              color={TextColor.textAlternative}
            >
              {t('snapAccess', [snap.manifest.proposedName])}
            </Typography>
            <Box width={FRACTIONS.TEN_TWELFTHS}>
              <PermissionsConnectPermissionList
                permissions={permissions ?? {}}
              />
            </Box>
          </div>
          <div className="view-snap__section">
            <Box width="11/12">
              <Typography variant={TypographyVariant.H4}>
                {t('connectedSites')}
              </Typography>
              <Typography
                variant={TypographyVariant.H6}
                color={TextColor.textAlternative}
              >
                {t('connectedSnapSites', [snap.manifest.proposedName])}
              </Typography>
              <ConnectedSitesList
                connectedSubjects={connectedSubjects}
                onDisconnect={(origin) => {
                  onDisconnect(origin, snap.id);
                }}
              />
            </Box>
          </div>
          <div className="view-snap__section">
            <Typography variant={TypographyVariant.H4}>
              {t('removeSnap')}
            </Typography>
            <Typography
              variant={TypographyVariant.H6}
              color={TextColor.textAlternative}
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
