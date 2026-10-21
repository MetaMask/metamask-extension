import React from 'react';
import { useSelector } from 'react-redux';
import {
  getAllNamespacesFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import {
  CaipChainId,
  CaipNamespace,
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../../../shared/lib/multichain/scope-utils';
import { getAccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import {
  getCaip25CaveatValueFromPermissions,
  type PermissionsRequest,
} from '../../../../helpers/utils/caip25-permissions';
import { supportsChainIds } from '../../../../hooks/useAccountGroupsForPermissions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MultichainEditAccountsPageWrapper } from '../../../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-account-wrapper';
import { SnapsPermissionsRequestType } from '../../../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-accounts-page';

type SnapChooseAccountProps = {
  permissions?: PermissionsRequest;
  onSubmit: (selection: {
    caipAccountIds: string[];
    caipChainIds: CaipChainId[];
    addresses: string[];
  }) => void;
  onClose: () => void;
};

/**
 * Component for Snaps account selection during runtime permission requests.
 *
 * @param props - The component props.
 * @param props.permissions - The requested permissions.
 * @param props.onSubmit - Called with the selected accounts and chains.
 * @param props.onClose - Called when the request is dismissed.
 */
export const SnapChooseAccount = ({
  permissions,
  onSubmit,
  onClose,
}: SnapChooseAccountProps) => {
  const t = useI18nContext();
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  const requestedCaip25CaveatValue =
    getCaip25CaveatValueFromPermissions(permissions);

  // Get all requested scopes (chain IDs), excluding wallet namespace
  const requestedCaipChainIds = getAllScopesFromCaip25CaveatValue(
    requestedCaip25CaveatValue,
  ).filter((chainId) => {
    try {
      const { namespace } = parseCaipChainId(chainId);
      return namespace !== KnownCaipNamespace.Wallet;
    } catch {
      return false;
    }
  }) as CaipChainId[];

  // Get all requested namespaces, excluding wallet namespace
  const requestedNamespaces = getAllNamespacesFromCaip25CaveatValue(
    requestedCaip25CaveatValue,
  ).filter(
    (namespace) => namespace !== KnownCaipNamespace.Wallet,
  ) as CaipNamespace[];

  // Build scopes to use: include all requested chain IDs
  const caipChainIdsToUse: CaipChainId[] = [...requestedCaipChainIds];

  // Only add wildcard scope for EIP-155 (EVM) namespace because
  // getCaip25AccountIdsFromAccountGroupAndScope only handles wildcard matching for EVM.
  // Non-EVM chains require exact scope matching.
  if (requestedNamespaces.includes(KnownCaipNamespace.Eip155)) {
    const evmWildcard = `${KnownCaipNamespace.Eip155}:0` as CaipChainId;
    if (!caipChainIdsToUse.includes(evmWildcard)) {
      caipChainIdsToUse.push(evmWildcard);
    }
  }

  return (
    <MultichainEditAccountsPageWrapper
      title={t('connectWithMetaMask')}
      permissions={permissions as PermissionsRequest}
      onSubmit={(accountGroupIds: string[]) => {
        const filteredAccountGroups = accountGroups.filter(
          (group) =>
            accountGroupIds.includes(group.id) &&
            supportsChainIds(group, caipChainIdsToUse),
        );
        const caipAccountIds = getCaip25AccountIdsFromAccountGroupAndScope(
          filteredAccountGroups,
          caipChainIdsToUse,
        );

        onSubmit({
          caipAccountIds,
          // Store all requested CAIP chain IDs - the chain-agnostic system can handle mixed EVM/non-EVM chains
          caipChainIds: requestedCaipChainIds,
          addresses: caipAccountIds.map(
            (caip25AccountId) => parseCaipAccountId(caip25AccountId).address,
          ),
        });
      }}
      onClose={onClose}
      snapsPermissionsRequestType={SnapsPermissionsRequestType.Initial}
    />
  );
};
