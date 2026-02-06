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
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Tag,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
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

/**
 * DappConnectionControlBar - A contextual footer bar shown only during active
 * dapp connections. Consolidates dapp-related controls: network selector,
 * permissions management, and disconnect.
 *
 * Layout:
 * Row 1: [Favicon] [Origin + Account name] ... [Connected badge]
 * Row 2: [Network selector button] [Settings] [Disconnect]
 */
export const DappConnectionControlBar: React.FC = () => {
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

  // Derived data (computed regardless of connection for hook consistency)
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

  return (
    <>
      <Box
        className="dapp-connection-control-bar"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={3}
        paddingLeft={4}
        paddingRight={4}
        gap={2}
        data-testid="dapp-connection-control-bar"
      >
        {/* ===== Upper row: Favicon + Origin/Account + Connected badge ===== */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={2}
          width={BlockSize.Full}
        >
          {/* Dapp favicon */}
          <AvatarFavicon
            name={connectedSubjectsMetadata?.name}
            size={Size.MD}
            src={connectedSubjectsMetadata?.iconUrl}
            data-testid="dapp-connection-control-bar__favicon"
          />

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

          {/* Connected badge - pushed to the right */}
          <Box style={{ marginLeft: 'auto' }}>
            <Tag
              label={t('tooltipSatusConnected')}
              backgroundColor={BackgroundColor.successMuted}
              borderRadius={BorderRadius.pill}
              labelProps={{
                color: TextColor.successDefault,
                variant: TextVariant.bodyXs,
              }}
              data-testid="dapp-connection-control-bar__connected-badge"
            />
          </Box>
        </Box>

        {/* ===== Lower row: Network selector + action icons ===== */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={2}
          width={BlockSize.Full}
        >
          {/* Network selector button - takes ~3/4 of the row */}
          {dappActiveNetwork && (
            <Box
              as="button"
              display={Display.Flex}
              alignItems={AlignItems.center}
              gap={1}
              padding={1}
              paddingLeft={2}
              paddingRight={2}
              className="dapp-connection-control-bar__network-button"
              onClick={handleNetworkClick}
              data-testid="dapp-connection-control-bar__network-button"
              style={{ flex: '1 1 0' }}
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
              <Text variant={TextVariant.bodyXs} ellipsis>
                {(dappActiveNetwork as { name?: string })?.name}
              </Text>
              <Icon
                name={IconName.ArrowDown}
                size={IconSize.Xs}
                color={IconColor.iconDefault}
                style={{ marginLeft: 'auto' }}
              />
            </Box>
          )}

          {/* Permissions button */}
          <Box className="dapp-connection-control-bar__action-icon">
            <ButtonIcon
              iconName={IconName.Setting}
              size={ButtonIconSize.Sm}
              ariaLabel={t('managePermissions')}
              onClick={handlePermissionsClick}
              data-testid="dapp-connection-control-bar__permissions-button"
            />
          </Box>

          {/* Disconnect button */}
          <Box className="dapp-connection-control-bar__action-icon">
            <ButtonIcon
              iconName={IconName.Logout}
              size={ButtonIconSize.Sm}
              color={IconColor.errorDefault}
              ariaLabel={t('disconnect')}
              onClick={handleDisconnectClick}
              data-testid="dapp-connection-control-bar__disconnect-button"
            />
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
