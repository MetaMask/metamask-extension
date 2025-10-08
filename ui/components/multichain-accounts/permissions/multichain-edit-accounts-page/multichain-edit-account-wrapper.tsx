import React, { useMemo } from 'react';
import { AccountGroupId } from '@metamask/account-api';
import {
  getAllNamespacesFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import {
  getCaip25CaveatValueFromPermissions,
  PermissionsRequest,
} from '../../../../pages/permissions-connect/connect-page/utils';
import { useAccountGroupsForPermissions } from '../../../../hooks/useAccountGroupsForPermissions';
import { MultichainEditAccountsPage } from './multichain-edit-accounts-page';

type MultichainEditAccountsPageWrapperProps = {
  title: string;
  onSubmit: (accountGroups: AccountGroupId[]) => void;
  onClose: () => void;
  permissions: PermissionsRequest;
};

export const MultichainEditAccountsPageWrapper = ({
  title,
  onSubmit,
  onClose,
  permissions,
}: MultichainEditAccountsPageWrapperProps) => {
  const requestedCaip25CaveatValueWithExistingPermissions = useMemo(() => {
    return getCaip25CaveatValueFromPermissions(permissions);
  }, [permissions]);

  const requestedCaipAccountIds = useMemo(() => {
    return getCaipAccountIdsFromCaip25CaveatValue(
      requestedCaip25CaveatValueWithExistingPermissions,
    );
  }, [requestedCaip25CaveatValueWithExistingPermissions]);

  const requestedCaipChainIds = getAllScopesFromCaip25CaveatValue(
    requestedCaip25CaveatValueWithExistingPermissions,
  ).filter((chainId) => {
    const { namespace } = parseCaipChainId(chainId);
    return namespace !== KnownCaipNamespace.Wallet;
  });

  const requestedNamespaces = getAllNamespacesFromCaip25CaveatValue(
    requestedCaip25CaveatValueWithExistingPermissions,
  );

  const requestedNamespacesWithoutWallet = requestedNamespaces.filter(
    (namespace) => namespace !== KnownCaipNamespace.Wallet,
  );

  const { connectedAccountGroups, supportedAccountGroups } =
    useAccountGroupsForPermissions(
      requestedCaip25CaveatValueWithExistingPermissions,
      requestedCaipAccountIds,
      requestedCaipChainIds,
      requestedNamespacesWithoutWallet,
    );

  const connectedAccountGroupIds = useMemo(() => {
    return connectedAccountGroups.map((group) => group.id);
  }, [connectedAccountGroups]);

  return (
    <MultichainEditAccountsPage
      title={title}
      defaultSelectedAccountGroups={connectedAccountGroupIds}
      supportedAccountGroups={supportedAccountGroups}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
};
