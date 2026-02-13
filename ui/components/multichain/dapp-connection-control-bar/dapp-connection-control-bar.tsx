import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { NonEmptyArray } from '@metamask/utils';
import { isInternalAccountInPermittedAccountIds } from '@metamask/chain-agnostic-permission';
import {
  AvatarFavicon,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getAllPermittedAccountsForCurrentTab,
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getPermissionSubjects,
  getSubjectMetadata,
} from '../../../selectors';
import {
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
import { getURLHost, shortenAddress } from '../../../helpers/utils/util';
import {
  DisconnectAllModal,
  DisconnectType,
} from '../disconnect-all-modal/disconnect-all-modal';

type DappConnectionControlBarProps = {
  placement: 'top' | 'bottom';
  onTogglePlacement: () => void;
};

/**
 * DappConnectionControlBar - A contextual bar shown only during active dapp
 * connections. Supports top (above header) or bottom (below content) placement.
 *
 * Layout (single row):
 * [Favicon+dot] [Origin / Account] ... [Network ↓] [Settings | Disconnect]
 *
 * @param options0
 * @param options0.placement
 * @param options0.onTogglePlacement
 */
export const DappConnectionControlBar: React.FC<
  DappConnectionControlBarProps
> = ({ placement, onTogglePlacement }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);
  const subjects = useSelector(getPermissionSubjects);
  const dappActiveNetwork = useSelector(getDappActiveNetwork);
  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);
  const accountGroupInternalAccounts = useSelector((state) =>
    getInternalAccountsFromGroupById(
      state as Parameters<typeof getInternalAccountsFromGroupById>[0],
      selectedAccountGroupId,
    ),
  );
  const orderedConnectedAccounts = useSelector(
    getOrderedConnectedAccountsForActiveTab,
  );

  const isConnectedToAccountGroup =
    selectedAccountGroupId &&
    accountGroupInternalAccounts?.some((account) =>
      isInternalAccountInPermittedAccountIds(account, permittedAccounts),
    );
  const isConnected = isConnectedToAccountGroup || permittedAccounts.length > 0;

  const selectedConnectedAccount = orderedConnectedAccounts?.[0];
  const selectedAccountName = selectedConnectedAccount?.metadata?.name ?? '';
  const selectedAccountAddress = selectedConnectedAccount?.address ?? '';
  const selectedAccountLabel = useMemo(() => {
    if (!selectedAccountName) {
      return '';
    }
    if (selectedAccountAddress) {
      return `${selectedAccountName} (${shortenAddress(selectedAccountAddress)})`;
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
        (permission: { parentCapability: string }) =>
          permission.parentCapability,
      ) as string[];
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

  const placementClass =
    placement === 'top'
      ? 'dapp-connection-control-bar--top'
      : 'dapp-connection-control-bar--bottom';

  return (
    <>
      <Box
        className={`dapp-connection-control-bar ${placementClass}`}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        padding={3}
        paddingLeft={4}
        paddingRight={4}
        gap={2}
        width={BlockSize.Full}
        data-testid="dapp-connection-control-bar"
      >
        {/* Left side: Favicon with green dot + Identity */}
        <Box
          as="button"
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={2}
          className="dapp-connection-control-bar__left-group"
          onClick={onTogglePlacement}
          data-testid="dapp-connection-control-bar__favicon-toggle"
          aria-label="Toggle control bar position"
        >
          {/* Favicon with connection dot overlay */}
          <Box className="dapp-connection-control-bar__favicon-wrapper">
            <AvatarFavicon
              name={connectedSubjectsMetadata?.name}
              size={Size.MD}
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
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            className="dapp-connection-control-bar__identity"
          >
            <Text
              variant={TextVariant.bodySmMedium}
              color={TextColor.textDefault}
              ellipsis
            >
              {siteName}
            </Text>
            {selectedAccountLabel && (
              <Text
                variant={TextVariant.bodyXs}
                color={TextColor.textAlternative}
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
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={2}
          style={{ marginLeft: 'auto' }}
        >
          {/* Network selector (icon-only, same size as action icons) */}
          {dappActiveNetwork && (
            <Box
              as="button"
              display={Display.Flex}
              alignItems={AlignItems.center}
              gap={1}
              className="dapp-connection-control-bar__network-button"
              onClick={handleNetworkClick}
              data-testid="dapp-connection-control-bar__network-button"
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                name={
                  (dappActiveNetwork as { name?: string })?.name ??
                  (dappActiveNetwork as { nickname?: string })?.nickname ??
                  ''
                }
                src={networkImageSrc}
                borderWidth={0}
              />
              <Icon
                name={IconName.ArrowDown}
                size={IconSize.Xs}
                color={IconColor.iconDefault}
              />
            </Box>
          )}

          {/* Combined settings + disconnect container */}
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            className="dapp-connection-control-bar__combined-actions"
          >
            {/* Permissions button */}
            <Box
              as="button"
              display={Display.Flex}
              alignItems={AlignItems.center}
              className="dapp-connection-control-bar__action-button"
              onClick={handlePermissionsClick}
              data-testid="dapp-connection-control-bar__permissions-button"
              aria-label={t('managePermissions')}
            >
              <Icon
                name={IconName.Setting}
                size={IconSize.Sm}
                color={IconColor.iconDefault}
              />
            </Box>

            {/* Vertical divider */}
            <Box className="dapp-connection-control-bar__divider" />

            {/* Disconnect button */}
            <Box
              as="button"
              display={Display.Flex}
              alignItems={AlignItems.center}
              className="dapp-connection-control-bar__action-button"
              onClick={handleDisconnectClick}
              data-testid="dapp-connection-control-bar__disconnect-button"
              aria-label={t('disconnect')}
            >
              <Icon
                name={IconName.Logout}
                size={IconSize.Sm}
                color={IconColor.errorDefault}
              />
            </Box>
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
