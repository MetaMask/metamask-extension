import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/rpc-methods';
import { getSnapPrefix } from '@metamask/snaps-utils';
import Button from '../../../../components/ui/button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Size,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import SnapAuthorship from '../../../../components/app/flask/snap-authorship';
import Box from '../../../../components/ui/box';
import SnapRemoveWarning from '../../../../components/app/flask/snap-remove-warning';
import ToggleButton from '../../../../components/ui/toggle-button';
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
  getTargetSubjectMetadata,
} from '../../../../selectors';
import {
  formatDate,
  getSnapName,
  removeSnapIdPrefix,
} from '../../../../helpers/utils/util';
import { ButtonLink, Text } from '../../../../components/component-library';
import SnapPermissionsList from '../../../../components/app/flask/snap-permissions-list';

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

  console.log('==================');
  console.log(snap);

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
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snap?.id),
  );
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
  const installInfo = versionHistory.length
    ? versionHistory[versionHistory.length - 1]
    : undefined;
  const packageName = snap.id && removeSnapIdPrefix(snap.id);
  const snapPrefix = snap.id && getSnapPrefix(snap.id);
  const isNPM = snapPrefix === 'npm:';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}`
    : packageName;
  const snapName = getSnapName(snap.id, targetSubjectMetadata);

  return (
    <Box
      className="view-snap"
      paddingBottom={8}
      paddingLeft={3}
      paddingRight={3}
    >
      <Box
        className="view-snap__header"
        paddingTop={8}
        marginLeft={4}
        marginRight={4}
      >
        <SnapAuthorship snapId={snap.id} />
      </Box>
      <Box
        className="view-snap__description"
        marginTop={4}
        marginLeft={4}
        marginRight={4}
      >
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {snap.manifest.description}
        </Text>
      </Box>
      <Box
        className="view-snap__version_info"
        marginTop={2}
        marginLeft={4}
        marginRight={4}
      >
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {`${t('youInstalled')} `}
          <span className="view-snap__version_info__version-number">
            v{snap.version}
          </span>
          {` ${t('ofTextNofM')} `}
          <ButtonLink
            size={Size.auto}
            href={url}
            target="_blank"
            className="view-snap__version_info__link"
          >
            {packageName}
          </ButtonLink>
          {installInfo && ` ${t('from').toLowerCase()} `}
          {installInfo && (
            <ButtonLink
              size={Size.auto}
              href={installInfo.origin}
              target="_blank"
              className="view-snap__version_info__link"
            >
              {installInfo.origin}
            </ButtonLink>
          )}
          {installInfo &&
            ` ${t('on').toLowerCase()} ${formatDate(
              installInfo.date,
              'dd MMM yyyy',
            )}`}
          .
        </Text>
      </Box>
      <Box
        className="view-snap__enable"
        marginTop={12}
        marginLeft={4}
        marginRight={4}
      >
        <Text variant={TextVariant.bodyLgMedium}>{t('enableSnap')}</Text>
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textDefault}
          marginBottom={4}
        >
          {t('enableSnapDescription')}
        </Text>
        <Box className="view-snap__enable__tooltip_wrapper">
          <Tooltip interactive position="left" html={t('snapsToggle')}>
            <ToggleButton
              value={snap.enabled}
              onToggle={onToggle}
              className="view-snap__toggle-button"
            />
          </Tooltip>
        </Box>
      </Box>
      <Box className="view-snap__permissions" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} marginLeft={4} marginRight={4}>
          {t('permissions')}
        </Text>
        <SnapPermissionsList
          permissions={permissions ?? {}}
          targetSubjectMetadata={targetSubjectMetadata}
        />
      </Box>
      <Box
        className="view-snap__connected-sites"
        marginTop={12}
        marginLeft={4}
        marginRight={4}
      >
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          {t('connectedSites')}
        </Text>
        <ConnectedSitesList
          connectedSubjects={connectedSubjects}
          onDisconnect={(origin) => {
            onDisconnect(origin, snap.id);
          }}
        />
      </Box>
      <Box
        className="view-snap__remove"
        marginTop={12}
        marginLeft={4}
        marginRight={4}
      >
        <Text variant={TextVariant.bodyLgMedium} color={TextColor.textDefault}>
          {t('removeSnap')}
        </Text>
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {t('removeSnapDescription')}
        </Text>
        <Box marginTop={4}>
          <Button
            className="view-snap__remove-button"
            type="danger"
            onClick={() => setIsShowingRemoveWarning(true)}
          >
            <Text variant={TextVariant.bodyMd} color={TextColor.errorDefault}>
              {`${t('remove')} ${snapName}`}
            </Text>
          </Button>
          {isShowingRemoveWarning && (
            <SnapRemoveWarning
              onCancel={() => setIsShowingRemoveWarning(false)}
              onSubmit={async () => {
                await dispatch(removeSnap(snap.id));
              }}
              snapName={snapName}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ViewSnap;
