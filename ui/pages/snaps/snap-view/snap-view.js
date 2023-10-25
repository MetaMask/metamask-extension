import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/rpc-methods';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  Color,
  Display,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import SnapAuthorshipExpanded from '../../../components/app/snaps/snap-authorship-expanded';
import SnapRemoveWarning from '../../../components/app/snaps/snap-remove-warning';
import ConnectedSitesList from '../../../components/app/connected-sites-list';
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import KeyringSnapRemovalWarning from '../../../components/app/snaps/keyring-snap-removal-warning';
///: END:ONLY_INCLUDE_IN
import { SNAPS_ROUTE } from '../../../helpers/constants/routes';
import {
  removeSnap,
  removePermissionsFor,
  updateCaveat,
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  showKeyringSnapRemovalModal,
  getSnapAccountsById,
  ///: END:ONLY_INCLUDE_IN
} from '../../../store/actions';
import {
  getSnaps,
  getSubjectsWithSnapPermission,
  getPermissions,
  getPermissionSubjects,
  getTargetSubjectMetadata,
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  getMemoizedMetaMaskIdentities,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import { getSnapName } from '../../../helpers/utils/util';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import SnapPermissionsList from '../../../components/app/snaps/snap-permissions-list';
import { SnapDelineator } from '../../../components/app/snaps/snap-delineator';
import { DelineatorType } from '../../../helpers/constants/snaps';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import { KeyringSnapRemovalResultStatus } from './constants';
///: END:ONLY_INCLUDE_IN

function SnapView() {
  const t = useI18nContext();
  const history = useHistory();
  const location = useLocation();
  const descriptionRef = useRef(null);
  const { pathname } = location;
  // The snap ID is in URI-encoded form in the last path segment of the URL.
  const decodedSnapId = decodeURIComponent(pathname.match(/[^/]+$/u)[0]);
  const snaps = useSelector(getSnaps);
  const snap = Object.entries(snaps)
    .map(([_, snapState]) => snapState)
    .find((snapState) => snapState.id === decodedSnapId);

  const [isShowingRemoveWarning, setIsShowingRemoveWarning] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  // eslint-disable-next-line no-unused-vars -- Main build does not use setIsRemovingKeyringSnap
  const [isRemovingKeyringSnap, setIsRemovingKeyringSnap] = useState(false);

  // eslint-disable-next-line no-unused-vars -- Main build does not use setKeyringAccounts
  const [keyringAccounts, setKeyringAccounts] = useState([]);
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  const identities = useSelector(getMemoizedMetaMaskIdentities);
  ///: END:ONLY_INCLUDE_IN

  useEffect(() => {
    if (!snap) {
      history.push(SNAPS_ROUTE);
    }
  }, [history, snap]);

  useEffect(() => {
    setIsOverflowing(
      descriptionRef.current &&
        descriptionRef.current.offsetHeight <
          descriptionRef.current.scrollHeight,
    );
  }, [descriptionRef]);

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

  let isKeyringSnap = false;
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  isKeyringSnap = Boolean(subjects[snap?.id]?.permissions?.snap_manageAccounts);

  useEffect(() => {
    if (isKeyringSnap) {
      (async () => {
        const addresses = await getSnapAccountsById(snap.id);
        const snapIdentities = Object.values(identities).filter((identity) =>
          addresses.includes(identity.address.toLowerCase()),
        );
        setKeyringAccounts(snapIdentities);
      })();
    }
  }, [snap?.id, identities, isKeyringSnap]);

  ///: END:ONLY_INCLUDE_IN

  const dispatch = useDispatch();

  const onDisconnect = (connectedOrigin, snapId) => {
    const caveatValue =
      subjects[connectedOrigin].permissions[WALLET_SNAP_PERMISSION_KEY]
        .caveats[0].value;
    const newCaveatValue = { ...caveatValue };
    delete newCaveatValue[snapId];
    if (Object.keys(newCaveatValue).length > 0) {
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

  const snapName = getSnapName(snap.id, targetSubjectMetadata);

  const shouldDisplayMoreButton = isOverflowing && !isDescriptionOpen;
  const handleMoreClick = () => {
    setIsDescriptionOpen(true);
  };

  return (
    <div className="snap-view">
      <Page backgroundColor={BackgroundColor.backgroundDefault}>
        <Header
          backgroundColor={BackgroundColor.backgroundDefault}
          startAccessory={
            <ButtonIcon
              ariaLabel="Back"
              iconName="arrow-left"
              size="sm"
              onClick={() => history.push(SNAPS_ROUTE)}
            />
          }
        >
          {snapName}
        </Header>
        <Content
          backgroundColor={BackgroundColor.backgroundDefault}
          className="snap-view__content"
        >
          <Box>
            <SnapAuthorshipExpanded snapId={snap.id} snap={snap} />
            <Box className="snap-view__content__description" marginTop={[4, 7]}>
              <SnapDelineator
                type={DelineatorType.Description}
                snapName={snapName}
              >
                <Box
                  className={classnames(
                    'snap-view__content__description__wrapper',
                    {
                      open: isDescriptionOpen,
                    },
                  )}
                  ref={descriptionRef}
                >
                  <Text>{snap?.manifest.description}</Text>
                  {shouldDisplayMoreButton && (
                    <Button
                      className="snap-view__content__description__more-button"
                      type="link"
                      onClick={handleMoreClick}
                    >
                      <Text color={Color.infoDefault}>{t('more')}</Text>
                    </Button>
                  )}
                </Box>
              </SnapDelineator>
            </Box>
            <Box className="snap-view__content__permissions" marginTop={12}>
              <Text variant={TextVariant.bodyLgMedium}>{t('permissions')}</Text>
              <SnapPermissionsList
                snapId={decodedSnapId}
                permissions={permissions ?? {}}
                targetSubjectMetadata={targetSubjectMetadata}
                showOptions
              />
            </Box>
            <Box className="snap-view__content__connected-sites" marginTop={12}>
              <Text variant={TextVariant.bodyLgMedium} marginBottom={2}>
                {t('connectedSites')}
              </Text>
              <ConnectedSitesList
                connectedSubjects={connectedSubjects}
                onDisconnect={(origin) => {
                  onDisconnect(origin, snap.id);
                }}
              />
            </Box>
            <Box className="snap-view__content__remove" marginTop={12}>
              <Text
                variant={TextVariant.bodyLgMedium}
                color={TextColor.textDefault}
              >
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
                  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
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
                  ///: END:ONLY_INCLUDE_IN
                }
              </Box>
            </Box>
          </Box>
        </Content>
      </Page>
    </div>
  );
}

export default SnapView;
