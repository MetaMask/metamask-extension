import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CaipChainId, NonEmptyArray, Hex } from '@metamask/utils';
import {
  getAllScopesFromCaip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import log from 'loglevel';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getAllPermittedChainsForSelectedTab,
  getConnectedSitesList,
  getPermissions,
  getPermissionSubjects,
} from '../../../../selectors';
import {
  removePermissionsFor,
  setPermittedAccounts,
} from '../../../../store/actions';
import { SubjectsType } from '../../../multichain/pages/connections/components/connections.types';
import { PREVIOUS_ROUTE } from '../../../../helpers/constants/routes';
import { DisconnectPermissionsModal } from '../../../multichain/disconnect-permissions-modal/disconnect-permissions-modal';
import { endTrace, trace, TraceName } from '../../../../../shared/lib/trace';
import { useAccountGroupsForPermissions } from '../../../../hooks/useAccountGroupsForPermissions';
import { getCaip25CaveatValueFromPermissions } from '../../../../helpers/utils/caip25-permissions';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../../../shared/lib/multichain/scope-utils';
import { MultichainEditAccountsPage } from '../multichain-edit-accounts-page/multichain-edit-accounts-page';
import {
  AppState,
  getTokenTransferPermissionsByOrigin,
  getPermissionMetaDataByOrigin,
} from '../../../../selectors/gator-permissions/gator-permissions';
import { useRevokeGatorPermissionsMultiChain } from '../../../../hooks/gator-permissions/useRevokeGatorPermissionsMultiChain';
import { useDispatch } from '../../../../store/hooks';

export const MultichainReviewPermissions = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const originParam = searchParams.get('origin');
  const securedOrigin = decodeURIComponent(originParam ?? '');
  const [showDisconnectPermissionsModal, setShowDisconnectPermissionsModal] =
    useState(false);
  const activeTabOrigin: string = securedOrigin;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjectMetadata: { [key: string]: any } = useSelector(
    getConnectedSitesList,
  );
  const connectedSubjectsMetadata = subjectMetadata[activeTabOrigin];
  const subjects = useSelector(getPermissionSubjects);

  const disconnectAllPermissions = useCallback(() => {
    const subject = (subjects as SubjectsType)[activeTabOrigin];

    if (subject) {
      const permissionMethodNames = Object.values(subject.permissions).map(
        ({ parentCapability }: { parentCapability: string }) =>
          parentCapability,
      ) as string[];
      if (permissionMethodNames.length > 0) {
        const permissionsRecord = {
          [activeTabOrigin]: permissionMethodNames as NonEmptyArray<string>,
        };

        dispatch(removePermissionsFor(permissionsRecord));
      }
    }
  }, [activeTabOrigin, dispatch, subjects]);

  const connectedChainIds = useSelector((state) =>
    getAllPermittedChainsForSelectedTab(state, activeTabOrigin),
  ) as CaipChainId[];

  const existingPermissions = useSelector((state) =>
    getPermissions(state, activeTabOrigin),
  );

  const existingCaip25CaveatValue = useMemo(
    () =>
      existingPermissions
        ? getCaip25CaveatValueFromPermissions(existingPermissions)
        : null,
    [existingPermissions],
  );

  const existingCaip25AccountIds = useMemo(() => {
    return getCaipAccountIdsFromCaip25CaveatValue(
      existingCaip25CaveatValue ?? {
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: {},
        isMultichainOrigin: false,
      },
    );
  }, [existingCaip25CaveatValue]);

  const existingCaipChainIds = existingCaip25CaveatValue
    ? getAllScopesFromCaip25CaveatValue(existingCaip25CaveatValue)
    : [];

  const { supportedAccountGroups, connectedAccountGroups } =
    useAccountGroupsForPermissions(
      existingCaip25CaveatValue ?? {
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: {},
        isMultichainOrigin: false,
      },
      existingCaip25AccountIds,
      existingCaipChainIds,
      [],
    );

  const selectedAccountGroupIds = useMemo(
    () => connectedAccountGroups.map((group) => group.id),
    [connectedAccountGroups],
  );

  const gatorPermissionsGroupMetaData = useSelector((state) =>
    getPermissionMetaDataByOrigin(state as AppState, activeTabOrigin),
  );

  // Gator permissions revocation logic
  const tokenTransferPermissions = useSelector((state: AppState) =>
    getTokenTransferPermissionsByOrigin(state, activeTabOrigin),
  );

  // Group permissions by chain ID for proper revocation
  const permissionsByChainId = useMemo(
    () =>
      tokenTransferPermissions.reduce(
        (acc, permission) => {
          const { chainId } = permission.permissionResponse;
          (acc[chainId] ||= []).push(permission);
          return acc;
        },
        {} as Record<Hex, typeof tokenTransferPermissions>,
      ),
    [tokenTransferPermissions],
  );

  // Hook for multi-chain permission revocation
  const { revokeGatorPermissionsBatchMultiChain } =
    useRevokeGatorPermissionsMultiChain();

  // Format permissions for the DisconnectPermissionsModal
  const formattedPermissions = useMemo(() => {
    return tokenTransferPermissions.map((permission) => ({
      permission,
      chainId: permission.permissionResponse.chainId,
      permissionType: permission.permissionResponse.permission.type,
    }));
  }, [tokenTransferPermissions]);

  // Handle disconnect flow with gator permissions check: if token transfer
  // permissions exist, shows the permissions modal, else disconnect directly
  const handleDisconnectWithGatorCheck = useCallback(() => {
    const hasTokenTransferPermissions =
      gatorPermissionsGroupMetaData &&
      Object.values(gatorPermissionsGroupMetaData).some(
        (details) => details.count > 0,
      );

    if (hasTokenTransferPermissions) {
      setShowDisconnectPermissionsModal(true);
      return;
    }

    trace({ name: TraceName.DisconnectAllModal });
    disconnectAllPermissions();
    endTrace({ name: TraceName.DisconnectAllModal });
    navigate(PREVIOUS_ROUTE);
  }, [disconnectAllPermissions, gatorPermissionsGroupMetaData, navigate]);

  const handleSkipPermissions = () => {
    setShowDisconnectPermissionsModal(false);
    // Skip permissions and disconnect directly
    trace({ name: TraceName.DisconnectAllModal });
    disconnectAllPermissions();
    endTrace({ name: TraceName.DisconnectAllModal });
    navigate(PREVIOUS_ROUTE);
  };

  const handleRemoveAllPermissions = async () => {
    try {
      trace({ name: TraceName.DisconnectAllModal });
      disconnectAllPermissions();
      endTrace({ name: TraceName.DisconnectAllModal });

      // Close the permissions modal immediately for better UX
      setShowDisconnectPermissionsModal(false);

      // Revoke gator permissions if they exist (run in background)
      if (tokenTransferPermissions.length > 0) {
        await revokeGatorPermissionsBatchMultiChain(permissionsByChainId);
      }
    } catch (error) {
      log.error('Error removing permissions:', error);
      // Still proceed to disconnect even if revocation fails
      setShowDisconnectPermissionsModal(false);
    } finally {
      navigate(PREVIOUS_ROUTE);
    }
  };

  const handleAccountGroupIdsSelected = useCallback(
    (accountGroupIds: string[]) => {
      if (accountGroupIds.length === 0) {
        handleDisconnectWithGatorCheck();
        return;
      }

      const accountGroups = supportedAccountGroups.filter((group) =>
        accountGroupIds.includes(group.id),
      );

      const caipAccountIds = getCaip25AccountIdsFromAccountGroupAndScope(
        accountGroups,
        connectedChainIds,
      );

      dispatch(setPermittedAccounts(activeTabOrigin, caipAccountIds));
      navigate(PREVIOUS_ROUTE);
    },
    [
      activeTabOrigin,
      connectedChainIds,
      dispatch,
      handleDisconnectWithGatorCheck,
      navigate,
      supportedAccountGroups,
    ],
  );

  return (
    <>
      <MultichainEditAccountsPage
        title={t('manageConnectedAccounts')}
        confirmButtonText={t('save')}
        supportedAccountGroups={supportedAccountGroups}
        defaultSelectedAccountGroups={selectedAccountGroupIds}
        onSubmit={handleAccountGroupIdsSelected}
        onClose={() => navigate(PREVIOUS_ROUTE)}
        siteMetadata={{
          origin: activeTabOrigin,
          name: connectedSubjectsMetadata?.name,
          iconUrl: connectedSubjectsMetadata?.iconUrl,
        }}
        onDisconnect={handleDisconnectWithGatorCheck}
      />
      {showDisconnectPermissionsModal ? (
        <DisconnectPermissionsModal
          isOpen={showDisconnectPermissionsModal}
          onClose={() => setShowDisconnectPermissionsModal(false)}
          onSkip={handleSkipPermissions}
          onRemoveAll={handleRemoveAllPermissions}
          permissions={formattedPermissions}
        />
      ) : null}
    </>
  );
};
