import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { NonEmptyArray } from '@metamask/utils';
import {
  getAllScopesFromCaip25CaveatValue,
  isInternalAccountInPermittedAccountIds,
} from '@metamask/chain-agnostic-permission';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getAllPermittedAccountsForCurrentTab,
  getOriginOfCurrentTab,
  getPermissions,
  getPermissionSubjects,
  getSubjectMetadata,
} from '../../../selectors';
import {
  getInternalAccountsFromGroupById,
  getMultichainAccountGroupById,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import { getDappActiveNetwork } from '../../../selectors/dapp';
import {
  addPermittedAccounts,
  hidePermittedNetworkToast,
  removePermissionsFor,
  toggleNetworkMenu,
} from '../../../store/actions';
import { REVIEW_PERMISSIONS } from '../../../helpers/constants/routes';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { getURLHost } from '../../../helpers/utils/util';
import { getCaip25CaveatValueFromPermissions } from '../../../pages/permissions-connect/connect-page/utils';
import { hasChainIdSupport } from '../../../../shared/lib/multichain/scope-utils';
import { Tag } from '../../component-library/tag/tag';
import { DisconnectAllModal } from '../disconnect-all-modal/disconnect-all-modal';

/**
 * DappConnectionControlBar - A contextual bar shown only during active dapp
 * connections. Rendered at the bottom of the wallet screen.
 *
 * Connected layout (single row):
 * [Favicon+green dot] [Origin / Account] ... [Network ↓] [Settings | Disconnect]
 *
 * Not-connected layout (active account is not among permitted accounts):
 * [Favicon+grey dot] [Origin / Account · Not connected] ... [Connect]
 */
export const DappConnectionControlBar: React.FC = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);
  const subjects = useSelector(getPermissionSubjects) as Record<
    string,
    { permissions: Record<string, { parentCapability: string }> }
  >;
  const dappActiveNetwork = useSelector(getDappActiveNetwork);
  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);
  const accountGroupInternalAccounts = useSelector((state) =>
    getInternalAccountsFromGroupById(
      state as Parameters<typeof getInternalAccountsFromGroupById>[0],
      selectedAccountGroupId,
    ),
  );
  const selectedAccountGroup = useSelector((state) =>
    getMultichainAccountGroupById(
      state as Parameters<typeof getMultichainAccountGroupById>[0],
      selectedAccountGroupId,
    ),
  );
  const existingPermissions = useSelector((state) =>
    activeTabOrigin ? getPermissions(state, activeTabOrigin) : undefined,
  );

  const isConnected = permittedAccounts.length > 0;

  const isActiveAccountConnected = useMemo(() => {
    if (
      permittedAccounts.length === 0 ||
      accountGroupInternalAccounts?.length === 0
    ) {
      return false;
    }
    return accountGroupInternalAccounts.some((account) =>
      isInternalAccountInPermittedAccountIds(account, permittedAccounts),
    );
  }, [permittedAccounts, accountGroupInternalAccounts]);

  const selectedAccountName = selectedAccountGroup?.metadata.name ?? '';

  const existingChainIds = useMemo(() => {
    if (!existingPermissions) {
      return [];
    }
    const caveatValue =
      getCaip25CaveatValueFromPermissions(existingPermissions);
    return caveatValue ? getAllScopesFromCaip25CaveatValue(caveatValue) : [];
  }, [existingPermissions]);

  const addressesToPermit = useMemo(() => {
    if (!accountGroupInternalAccounts?.length) {
      return [];
    }
    return accountGroupInternalAccounts
      .filter((account) => hasChainIdSupport(account.scopes, existingChainIds))
      .map((account) => account.address);
  }, [accountGroupInternalAccounts, existingChainIds]);

  const connectedSubjectsMetadata = activeTabOrigin
    ? subjectMetadata[activeTabOrigin]
    : undefined;

  const siteName = useMemo(() => {
    if (!activeTabOrigin) {
      return '';
    }
    const isWebOrigin =
      activeTabOrigin.startsWith('http://') ||
      activeTabOrigin.startsWith('https://');
    const siteHost = isWebOrigin ? getURLHost(activeTabOrigin) : '';
    return siteHost || connectedSubjectsMetadata?.name || activeTabOrigin;
  }, [activeTabOrigin, connectedSubjectsMetadata?.name]);

  const networkImageSrc = dappActiveNetwork?.chainId
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        dappActiveNetwork.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ]
    : undefined;

  const handleNetworkClick = useCallback(() => {
    dispatch(
      toggleNetworkMenu({
        isAccessedFromDappConnectedSitePopover: true,
        isAddingNewNetwork: false,
        isMultiRpcOnboarding: false,
      }),
    );
  }, [dispatch]);

  const handlePermissionsClick = useCallback(() => {
    if (activeTabOrigin) {
      navigate(
        `${REVIEW_PERMISSIONS}?origin=${encodeURIComponent(activeTabOrigin)}`,
      );
    }
  }, [navigate, activeTabOrigin]);

  const handleDisconnect = useCallback(() => {
    if (!activeTabOrigin) {
      return;
    }
    const subject = subjects[activeTabOrigin];
    if (subject) {
      const permissionMethodNames = Object.values(subject.permissions).map(
        (permission) => permission.parentCapability,
      );
      if (permissionMethodNames.length > 0) {
        const permissionsRecord = {
          [activeTabOrigin]: permissionMethodNames as NonEmptyArray<string>,
        };
        dispatch(removePermissionsFor(permissionsRecord));
      }
    }
    dispatch(hidePermittedNetworkToast());
    setShowDisconnectModal(false);
  }, [dispatch, subjects, activeTabOrigin]);

  const handleDisconnectClick = useCallback(() => {
    setShowDisconnectModal(true);
  }, []);

  const handleCloseDisconnectModal = useCallback(() => {
    setShowDisconnectModal(false);
  }, []);

  const handleConnectClick = useCallback(() => {
    if (!activeTabOrigin || addressesToPermit.length === 0) {
      return;
    }
    dispatch(addPermittedAccounts(activeTabOrigin, addressesToPermit));
  }, [dispatch, activeTabOrigin, addressesToPermit]);

  if (!isConnected || !activeTabOrigin) {
    return null;
  }

  const showNotConnectedState = !isActiveAccountConnected;
  const canConnect = showNotConnectedState && addressesToPermit.length > 0;

  return (
    <>
      <Box
        className="dapp-connection-control-bar w-full"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.End}
        padding={3}
        paddingLeft={4}
        paddingRight={4}
        gap={2}
        data-testid="dapp-connection-control-bar"
      >
        {/* Left side: Favicon with green dot + Identity */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.End}
          gap={2}
          className="dapp-connection-control-bar__left-group"
        >
          {/* Favicon with connection dot overlay */}
          <Box className="dapp-connection-control-bar__favicon-wrapper">
            <AvatarFavicon
              name={connectedSubjectsMetadata?.name}
              size={AvatarFaviconSize.Md}
              src={connectedSubjectsMetadata?.iconUrl}
              data-testid="dapp-connection-control-bar__favicon"
            />
            <Box
              className={
                showNotConnectedState
                  ? 'dapp-connection-control-bar__connection-dot dapp-connection-control-bar__connection-dot--not-connected'
                  : 'dapp-connection-control-bar__connection-dot'
              }
              data-testid="dapp-connection-control-bar__connection-dot"
            />
          </Box>

          {/* Origin + Account stacked */}
          <Box
            flexDirection={BoxFlexDirection.Column}
            className="dapp-connection-control-bar__identity"
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              ellipsis
            >
              {siteName}
            </Text>
            {selectedAccountName && (
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={1}
                className="dapp-connection-control-bar__account-row"
              >
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                  ellipsis
                  data-testid="dapp-connection-control-bar__account-name"
                >
                  {selectedAccountName}
                </Text>
                {showNotConnectedState && (
                  <Tag
                    label={t('statusNotConnected')}
                    textVariant={TextVariant.BodyXs}
                    className="dapp-connection-control-bar__not-connected-tag"
                    data-testid="dapp-connection-control-bar__not-connected-tag"
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Right side: swap between Connect CTA (not-connected) and action icons */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.End}
          gap={2}
          className="ml-auto"
        >
          {showNotConnectedState ? (
            canConnect && (
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Md}
                onClick={handleConnectClick}
                data-testid="dapp-connection-control-bar__connect-button"
                className="dapp-connection-control-bar__connect-button"
              >
                {t('connect')}
              </Button>
            )
          ) : (
            <>
              {/* Network selector (icon-only, same size as action icons) */}
              {dappActiveNetwork && (
                <button
                  className="dapp-connection-control-bar__network-button flex items-center gap-1"
                  onClick={handleNetworkClick}
                  data-testid="dapp-connection-control-bar__network-button"
                  type="button"
                >
                  <AvatarNetwork
                    className="dapp-connection-control-bar__network-icon"
                    size={AvatarNetworkSize.Xs}
                    name={
                      (dappActiveNetwork as { name?: string })?.name ??
                      (dappActiveNetwork as { nickname?: string })?.nickname ??
                      ''
                    }
                    src={networkImageSrc}
                  />
                  <Icon
                    name={IconName.ArrowDown}
                    size={IconSize.Xs}
                    color={IconColor.IconDefault}
                  />
                </button>
              )}

              {/* Combined settings + disconnect container */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.End}
                className="dapp-connection-control-bar__combined-actions"
              >
                {/* Permissions button */}
                <button
                  className="dapp-connection-control-bar__action-button flex items-center"
                  onClick={handlePermissionsClick}
                  data-testid="dapp-connection-control-bar__permissions-button"
                  aria-label={t('managePermissions')}
                  type="button"
                >
                  <Icon
                    name={IconName.Setting}
                    size={IconSize.Sm}
                    color={IconColor.IconDefault}
                  />
                </button>

                {/* Vertical divider */}
                <Box className="dapp-connection-control-bar__divider" />

                {/* Disconnect button */}
                <button
                  className="dapp-connection-control-bar__action-button flex items-center"
                  onClick={handleDisconnectClick}
                  data-testid="dapp-connection-control-bar__disconnect-button"
                  aria-label={t('disconnect')}
                  type="button"
                >
                  <Icon
                    name={IconName.Logout}
                    size={IconSize.Sm}
                    color={IconColor.ErrorDefault}
                  />
                </button>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Disconnect confirmation modal */}
      {showDisconnectModal && (
        <DisconnectAllModal
          onClose={handleCloseDisconnectModal}
          onClick={handleDisconnect}
        />
      )}
    </>
  );
};
