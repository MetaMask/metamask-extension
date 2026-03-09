import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { NonEmptyArray, parseCaipAccountId } from '@metamask/utils';
import { isInternalAccountInPermittedAccountIds } from '@metamask/chain-agnostic-permission';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
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
  getInternalAccountByAddress,
  getOriginOfCurrentTab,
  getPermissionSubjects,
  getSelectedInternalAccount,
  getSubjectMetadata,
} from '../../../selectors';
import {
  getAccountGroupsByAddress,
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import { getDappActiveNetwork } from '../../../selectors/dapp';
import {
  hidePermittedNetworkToast,
  removePermissionsFor,
  toggleNetworkMenu,
} from '../../../store/actions';
import { REVIEW_PERMISSIONS } from '../../../helpers/constants/routes';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { getURLHost } from '../../../helpers/utils/util';
import {
  DisconnectAllModal,
  DisconnectType,
} from '../disconnect-all-modal/disconnect-all-modal';

/**
 * DappConnectionControlBar - A contextual bar shown only during active dapp
 * connections. Rendered at the bottom of the wallet screen.
 *
 * Layout (single row):
 * [Favicon+dot] [Origin / Account] ... [Network ↓] [Settings | Disconnect]
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
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);

  const firstPermittedAddress = useMemo(() => {
    if (permittedAccounts.length === 0) {
      return undefined;
    }
    try {
      return parseCaipAccountId(permittedAccounts[0]).address;
    } catch {
      return undefined;
    }
  }, [permittedAccounts]);

  const connectedAccountByAddress = useSelector((state) =>
    firstPermittedAddress
      ? getInternalAccountByAddress(
          state as Parameters<typeof getInternalAccountByAddress>[0],
          firstPermittedAddress,
        )
      : undefined,
  );

  const connectedAccountAddresses = useMemo(
    () => (firstPermittedAddress ? [firstPermittedAddress] : []),
    [firstPermittedAddress],
  );
  const connectedAccountGroups = useSelector((state) =>
    connectedAccountAddresses.length > 0
      ? getAccountGroupsByAddress(
          state as Parameters<typeof getAccountGroupsByAddress>[0],
          connectedAccountAddresses,
        )
      : [],
  );

  const isConnectedToAccountGroup =
    selectedAccountGroupId &&
    accountGroupInternalAccounts?.some((account) =>
      isInternalAccountInPermittedAccountIds(account, permittedAccounts),
    );
  const isConnected = isConnectedToAccountGroup || permittedAccounts.length > 0;

  const selectedConnectedAccount =
    connectedAccountByAddress ?? selectedInternalAccount;
  const selectedAccountAddress = selectedConnectedAccount?.address ?? '';
  const selectedAccountName = useMemo(() => {
    if (connectedAccountGroups.length > 0) {
      return connectedAccountGroups[0].metadata.name;
    }
    return selectedConnectedAccount?.metadata?.name ?? '';
  }, [connectedAccountGroups, selectedConnectedAccount]);
  const selectedAccountLabel = useMemo(() => {
    if (!selectedAccountName) {
      return '';
    }
    if (selectedAccountAddress) {
      const truncated = `${selectedAccountAddress.slice(0, 6)}...${selectedAccountAddress.slice(-4)}`;
      return `${selectedAccountName} (${truncated})`;
    }
    return selectedAccountName;
  }, [selectedAccountName, selectedAccountAddress]);

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
      navigate(`${REVIEW_PERMISSIONS}/${encodeURIComponent(activeTabOrigin)}`);
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

  if (!isConnected || !activeTabOrigin) {
    return null;
  }

  return (
    <>
      <Box
        className="dapp-connection-control-bar w-full"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        padding={3}
        paddingLeft={4}
        paddingRight={4}
        gap={2}
        data-testid="dapp-connection-control-bar"
      >
        {/* Left side: Favicon with green dot + Identity */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
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
              className="dapp-connection-control-bar__connection-dot"
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
            {selectedAccountLabel && (
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
                ellipsis
                data-testid="dapp-connection-control-bar__account-name"
              >
                {selectedAccountLabel}
              </Text>
            )}
          </Box>
        </Box>

        {/* Right side: Network selector + Combined action icons */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="ml-auto"
        >
          {/* Network selector (icon-only, same size as action icons) */}
          {dappActiveNetwork && (
            <button
              className="dapp-connection-control-bar__network-button flex items-center gap-1"
              onClick={handleNetworkClick}
              data-testid="dapp-connection-control-bar__network-button"
              type="button"
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Sm}
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
            alignItems={BoxAlignItems.Center}
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
        </Box>
      </Box>

      {/* Disconnect confirmation modal */}
      {showDisconnectModal && (
        <DisconnectAllModal
          type={DisconnectType.Account}
          hostname={activeTabOrigin}
          onClose={handleCloseDisconnectModal}
          onClick={handleDisconnect}
        />
      )}
    </>
  );
};
