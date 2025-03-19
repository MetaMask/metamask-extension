import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import semver from 'semver';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import SnapAuthorshipExpanded from '../../../components/app/snaps/snap-authorship-expanded';
import SnapRemoveWarning from '../../../components/app/snaps/snap-remove-warning';
import ConnectedSitesList from '../../../components/app/connected-sites-list';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import KeyringSnapRemovalWarning from '../../../components/app/snaps/keyring-snap-removal-warning';
///: END:ONLY_INCLUDE_IF
import {
  removeSnap,
  disconnectOriginFromSnap,
  updateSnap,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  showKeyringSnapRemovalModal,
  getSnapAccountsById,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
import {
  getSnaps,
  getSubjectsWithSnapPermission,
  getPermissions,
  getSnapLatestVersion,
  getSnapMetadata,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getMemoizedMetaMaskInternalAccounts,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import SnapPermissionsList from '../../../components/app/snaps/snap-permissions-list';
import { SnapDelineator } from '../../../components/app/snaps/snap-delineator';
import { DelineatorType } from '../../../helpers/constants/snaps';
import SnapUpdateAlert from '../../../components/app/snaps/snap-update-alert';
import { CONNECT_ROUTE } from '../../../helpers/constants/routes';
import { ShowMore } from '../../../components/app/snaps/show-more';
import { isSnapId } from '../../../helpers/utils/snaps';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { KeyringSnapRemovalResultStatus } from './constants';
///: END:ONLY_INCLUDE_IF

function SnapSettings({ snapId, initRemove, resetInitRemove }) {
  const history = useHistory();
  const t = useI18nContext();
  const snaps = useSelector(getSnaps);
  const dispatch = useDispatch();

  const snap = Object.entries(snaps)
    .map(([_, snapState]) => snapState)
    .find((snapState) => snapState.id === snapId);

  const [isShowingRemoveWarning, setIsShowingRemoveWarning] = useState(false);
  // eslint-disable-next-line no-unused-vars -- Main build does not use setIsRemovingKeyringSnap
  const [isRemovingKeyringSnap, setIsRemovingKeyringSnap] = useState(false);

  // eslint-disable-next-line no-unused-vars -- Main build does not use setKeyringAccounts
  const [keyringAccounts, setKeyringAccounts] = useState([]);
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const internalAccounts = useSelector(getMemoizedMetaMaskInternalAccounts);
  ///: END:ONLY_INCLUDE_IF

  const connectedSubjects = useSelector((state) =>
    getSubjectsWithSnapPermission(state, snap?.id),
  );
  const permissions = useSelector(
    (state) => snap && getPermissions(state, snap.id),
  );

  const { name: snapName, description } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  let isKeyringSnap = false;
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  isKeyringSnap = Boolean(permissions?.snap_manageAccounts);

  useEffect(() => {
    if (isKeyringSnap) {
      (async () => {
        const addresses = await getSnapAccountsById(snap.id);
        const snapIdentities = Object.values(internalAccounts).filter(
          (internalAccount) =>
            addresses.includes(internalAccount.address.toLowerCase()),
        );
        setKeyringAccounts(snapIdentities);
      })();
    }
  }, [snap?.id, internalAccounts, isKeyringSnap]);
  ///: END:ONLY_INCLUDE_IF

  const onDisconnect = (connectedOrigin) => {
    dispatch(disconnectOriginFromSnap(connectedOrigin, snap.id));
  };

  const latestRegistryVersion = useSelector((state) =>
    snap ? getSnapLatestVersion(state, snap?.id) : null,
  );

  const isUpdateAvailable = latestRegistryVersion
    ? semver.gt(latestRegistryVersion, snap.version)
    : false;

  const handleUpdate = async () => {
    const snapToInstall = {
      [snap.id]: {
        version: latestRegistryVersion,
      },
    };
    const approvalId = await dispatch(updateSnap('MetaMask', snapToInstall));

    if (approvalId) {
      history.push(`${CONNECT_ROUTE}/${approvalId}`);
    }
  };

  const connectedTitle = () => {
    if (connectedSubjects.every((subject) => isSnapId(subject.origin))) {
      return t('connectedSnaps');
    } else if (connectedSubjects.some((subject) => isSnapId(subject.origin))) {
      return t('connectedSitesAndSnaps');
    }
    return t('connectedSites');
  };

  useEffect(() => {
    if (initRemove) {
      setIsShowingRemoveWarning(true);
      resetInitRemove();
    }
  }, [initRemove, resetInitRemove]);

  return (
    <Box>
      {isUpdateAvailable && (
        <SnapUpdateAlert
          snapName={snapName}
          onUpdateClick={handleUpdate}
          bannerAlertProps={{ marginBottom: 4 }}
        />
      )}
      <SnapAuthorshipExpanded snapId={snap.id} snap={snap} />
      <Box className="snap-view__content__description" marginTop={[4, 7]}>
        <SnapDelineator type={DelineatorType.Description} snapName={snapName}>
          <ShowMore buttonBackground={BackgroundColor.backgroundDefault}>
            <Text>{description}</Text>
          </ShowMore>
        </SnapDelineator>
      </Box>
      <Box className="snap-view__content__permissions" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={1}>
          {t('permissions')}
        </Text>
        <SnapPermissionsList
          snapId={snapId}
          snapName={snapName}
          permissions={permissions ?? {}}
          showOptions
          showAllPermissions
        />
      </Box>
      <Box className="snap-view__content__connected-sites" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={2}>
          {connectedTitle()}
        </Text>
        <ConnectedSitesList
          connectedSubjects={connectedSubjects}
          onDisconnect={(origin) => {
            onDisconnect(origin, snap.id);
          }}
        />
      </Box>
      <Box className="snap-view__content__remove" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} color={TextColor.textDefault}>
          {t('removeSnap')}
        </Text>
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {t('removeSnapDescription')}
        </Text>
        <Box
          marginTop={4}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
        >
          <Button
            className="snap-view__content__remove-button"
            danger="true"
            variant={ButtonVariant.Secondary}
            width={BlockSize.Full}
            size={ButtonSize.Lg}
            onClick={() => setIsShowingRemoveWarning(true)}
            data-testid="remove-snap-button"
            disabled={snap.preinstalled && snap.removable === false}
          >
            <Text
              color={TextColor.inherit}
              variant={TextVariant.bodyMd}
              flexWrap={FlexWrap.NoWrap}
              ellipsis
              style={{ overflow: 'hidden' }}
              paddingTop={3}
              paddingBottom={3}
            >
              {`${t('remove')} ${snapName}`}
            </Text>
          </Button>
          <SnapRemoveWarning
            isOpen={
              isShowingRemoveWarning &&
              (!isKeyringSnap || keyringAccounts.length === 0) &&
              !isRemovingKeyringSnap
            }
            onCancel={() => setIsShowingRemoveWarning(false)}
            onSubmit={async () => {
              await dispatch(removeSnap(snap.id));
            }}
            snapName={snapName}
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
            <>
              <KeyringSnapRemovalWarning
                snap={snap}
                keyringAccounts={keyringAccounts}
                snapUrl={snap.url}
                onCancel={() => setIsShowingRemoveWarning(false)}
                onClose={() => setIsShowingRemoveWarning(false)}
                onBack={() => setIsShowingRemoveWarning(false)}
                onSubmit={async () => {
                  try {
                    setIsRemovingKeyringSnap(true);
                    await dispatch(removeSnap(snap.id));
                    setIsShowingRemoveWarning(false);
                    dispatch(
                      showKeyringSnapRemovalModal({
                        snapName,
                        result: KeyringSnapRemovalResultStatus.Success,
                      }),
                    );
                  } catch {
                    setIsShowingRemoveWarning(false);
                    dispatch(
                      showKeyringSnapRemovalModal({
                        snapName,
                        result: KeyringSnapRemovalResultStatus.Failed,
                      }),
                    );
                  } finally {
                    setIsRemovingKeyringSnap(false);
                  }
                }}
                isOpen={
                  isShowingRemoveWarning &&
                  isKeyringSnap &&
                  keyringAccounts.length > 0
                }
              />
            </>
            ///: END:ONLY_INCLUDE_IF
          }
        </Box>
      </Box>
    </Box>
  );
}

SnapSettings.propTypes = {
  snapId: PropTypes.string.isRequired,
  initRemove: PropTypes.bool,
  resetInitRemove: PropTypes.func,
};

export default SnapSettings;
