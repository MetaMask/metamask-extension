import React, { useMemo } from 'react';
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
import { CAIP_FORMATTED_TEST_CHAINS } from '../../../../../shared/constants/network';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../../../shared/lib/multichain/scope-utils';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import { getPermissions } from '../../../../selectors';
import { getMultichainNetwork } from '../../../../selectors/multichain';
import { getAccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import type { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../selectors/selectors.types';
import { getDefaultConnectChainIds } from '../../../../helpers/utils/connect-default-chains';
import {
  getCaip25CaveatValueFromPermissions,
  type PermissionsRequest,
} from '../../../../helpers/utils/caip25-permissions';
import { supportsChainIds } from '../../../../hooks/useAccountGroupsForPermissions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MultichainEditAccountsPageWrapper } from '../../../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-account-wrapper';
import { SnapsPermissionsRequestType } from '../../../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-accounts-page';

type SnapChooseAccountProps = {
  request: {
    permissions?: PermissionsRequest;
    metadata?: {
      origin: string;
      isEip1193Request?: boolean;
    };
  };
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
 * @param props.request - The permissions request.
 * @param props.onSubmit - Called with the selected accounts and chains.
 * @param props.onClose - Called when the request is dismissed.
 */
export const SnapChooseAccount = ({
  request,
  onSubmit,
  onClose,
}: SnapChooseAccountProps) => {
  const { permissions, metadata } = request;
  const t = useI18nContext();
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);
  const networkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );
  const globallySelectedNetwork = useSelector(getMultichainNetwork);
  const existingPermissions = useSelector((state) =>
    getPermissions(state, metadata?.origin),
  );

  const { caipChainIdsToUse, defaultConnectChainIds } = useMemo(() => {
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

    const [nonTestNetworkConfigurations, testNetworkConfigurations] =
      Object.entries(networkConfigurationsByCaipChainId).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const caipChainId = chainId as CaipChainId;
          const isTestNetwork =
            CAIP_FORMATTED_TEST_CHAINS.includes(caipChainId);
          (isTestNetwork ? testNetworksList : nonTestNetworksList).push({
            ...network,
            caipChainId,
          });
          return [nonTestNetworksList, testNetworksList];
        },
        [
          [] as EvmAndMultichainNetworkConfigurationsWithCaipChainId[],
          [] as EvmAndMultichainNetworkConfigurationsWithCaipChainId[],
        ],
      );

    const defaultChainIds = getDefaultConnectChainIds({
      nonTestNetworkConfigurations,
      testNetworkConfigurations,
      globallySelectedNetworkChainId: globallySelectedNetwork.chainId,
      requestedCaipChainIds,
      alreadyConnectedCaipChainIds: existingPermissions
        ? getAllScopesFromCaip25CaveatValue(
            getCaip25CaveatValueFromPermissions(existingPermissions),
          )
        : [],
      requestedNamespaces,
      requestedNamespacesWithoutWallet: requestedNamespaces,
      isEip1193Request: Boolean(metadata?.isEip1193Request),
      isEip1193CompatibleRequest: false,
      isSolanaWalletStandardRequest: false,
      isTronWalletAdapterRequest: false,
    });

    // EIP-1193 only exposes EVM chains, so never grant non-EVM chains for it.
    const chainIds = metadata?.isEip1193Request
      ? defaultChainIds.filter(
          (chainId) =>
            parseCaipChainId(chainId).namespace === KnownCaipNamespace.Eip155,
        )
      : defaultChainIds;

    const scopes: CaipChainId[] = [...chainIds];

    // Only add wildcard scope for EIP-155 (EVM) namespace because
    // getCaip25AccountIdsFromAccountGroupAndScope only handles wildcard matching for EVM.
    // Non-EVM chains require exact scope matching.
    if (requestedNamespaces.includes(KnownCaipNamespace.Eip155)) {
      const evmWildcard = `${KnownCaipNamespace.Eip155}:0` as CaipChainId;
      if (!scopes.includes(evmWildcard)) {
        scopes.push(evmWildcard);
      }
    }

    return { caipChainIdsToUse: scopes, defaultConnectChainIds: chainIds };
  }, [
    permissions,
    metadata?.isEip1193Request,
    networkConfigurationsByCaipChainId,
    globallySelectedNetwork.chainId,
    existingPermissions,
  ]);

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
          caipChainIds: defaultConnectChainIds,
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
