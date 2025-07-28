import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex, hexToNumber } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
import { v4 as uuid } from 'uuid';
import { addTransaction } from '../../store/actions';
import { addTransactionBatch } from '../../store/controller-actions/transaction-controller';
import { selectDefaultRpcEndpointByChainId } from '../../selectors';
import { useConfirmationNavigation } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import {
  encodeDisableDelegation,
  Delegation,
} from '../../../shared/lib/delegation/delegation';
import { getDeleGatorEnvironment } from '../../../shared/lib/delegation';
import { useEIP7702Account } from '../../pages/confirmations/hooks/useEIP7702Account';
import { useEIP7702Networks } from '../../pages/confirmations/hooks/useEIP7702Networks';

type TransactionCall = {
  params: {
    data?: `0x${string}` | undefined;
    value?: `0x${string}` | undefined;
    to?: `0x${string}` | undefined;
  };
};

type RevokeGatorPermissionArgs = {
  permissionContext: Hex;
  delegationManagerAddress: Hex;
};

export function useRevokeGatorPermissions({
  accountAddress,
  chainId,
  onRedirect,
}: {
  accountAddress: Hex;
  chainId: Hex;
  onRedirect?: () => void;
}) {
  const { network7702List } = useEIP7702Networks(accountAddress);
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
  const defaultRpcEndpoint = useSelector((state) =>
    selectDefaultRpcEndpointByChainId(state, chainId),
  ) ?? { defaultRpcEndpoint: {} };
  const { networkClientId } = defaultRpcEndpoint as { networkClientId: string };

  const { upgradeAccount: upgradeAccountEIP7702, isUpgraded } =
    useEIP7702Account({
      chainId,
    });

  const isRedirectPending = useMemo(() => {
    return confirmations.some((conf) => conf.id === transactionId);
  }, [confirmations, transactionId]);

  const network7702Config = useMemo(
    () => network7702List.find((network) => network.chainIdHex === chainId),
    [network7702List, chainId],
  );

  const upgradeContractAddress = useMemo(() => {
    return getDeleGatorEnvironment(hexToNumber(chainId))
      .EIP7702StatelessDeleGatorImpl;
  }, [chainId]);

  const generateSecurityAlertId = useCallback((): string => uuid(), []);

  const upgradeAccount = useCallback(async () => {
    if (network7702Config?.isSupported) {
      return;
    }

    if (!network7702Config?.upgradeContractAddress && !upgradeContractAddress) {
      throw new Error('No upgrade contract address found');
    }

    if (network7702Config?.upgradeContractAddress) {
      await upgradeAccountEIP7702(
        accountAddress,
        network7702Config?.upgradeContractAddress,
      );
    } else {
      await upgradeAccountEIP7702(accountAddress, upgradeContractAddress);
    }
  }, [
    accountAddress,
    network7702Config,
    upgradeAccountEIP7702,
    upgradeContractAddress,
  ]);

  const extractDelegationFromGatorPermissionContext = useCallback(
    (permissionContext: Hex): Delegation => {
      // Gator 7715 permissions only have a single signed delegation:
      // https://github.com/MetaMask/snap-7715-permissions/blob/main/packages/gator-permissions-snap/src/core/permissionRequestLifecycleOrchestrator.ts#L259
      const delegations = decodeDelegations(permissionContext);
      const firstDelegation = delegations[0];
      if (!firstDelegation) {
        throw new Error('No delegation found');
      }

      return {
        ...firstDelegation,
        salt: firstDelegation.salt.toString() as `0x${string}`,
      };
    },
    [],
  );

  const assertDelegatorAddress = useCallback(
    (delegation: Delegation) => {
      if (delegation.delegator.toLowerCase() !== accountAddress.toLowerCase()) {
        throw new Error(
          `Delegator address does not match. Expected: ${accountAddress}, Got: ${delegation.delegator}`,
        );
      }
    },
    [accountAddress],
  );

  const revokeGatorPermission = useCallback(
    async (
      permissionContext: Hex,
      delegationManagerAddress: Hex,
    ): Promise<TransactionMeta> => {
      const delegation =
        extractDelegationFromGatorPermissionContext(permissionContext);

      assertDelegatorAddress(delegation);

      const encodedCallData = encodeDisableDelegation({
        delegation,
      });

      // This transaction will revert if the `msg.sender` is not the 'delegator' in the delegation that is being revoked
      // TODO: We need to use the internal account address here that is the delegator address of the delegation that is being revoked
      const transactionMeta = await addTransaction(
        {
          from: accountAddress,
          to: delegationManagerAddress,
          data: encodedCallData,
          value: '0x0',
        },
        {
          networkClientId,
          type: TransactionType.contractInteraction,
        },
      );
      setTransactionId(transactionMeta?.id);

      return transactionMeta;
    },
    [
      extractDelegationFromGatorPermissionContext,
      assertDelegatorAddress,
      networkClientId,
      accountAddress,
    ],
  );

  const revokeGatorPermissionBatch = useCallback(
    async (
      revokeGatorPermissionArgs: RevokeGatorPermissionArgs[],
    ): Promise<TransactionMeta> => {
      const isAccountUpgraded = await isUpgraded(accountAddress);
      if (!isAccountUpgraded) {
        await upgradeAccount();
      }

      if (revokeGatorPermissionArgs.length === 0) {
        throw new Error('No permission contexts provided');
      }

      // Process each permission context to get the encoded call data
      const transactions: TransactionCall[] = [];
      for (const revokeGatorPermissionArg of revokeGatorPermissionArgs) {
        const { permissionContext, delegationManagerAddress } =
          revokeGatorPermissionArg;
        const delegation =
          extractDelegationFromGatorPermissionContext(permissionContext);

        const encodedCallData = encodeDisableDelegation({
          delegation,
        });

        transactions.push({
          params: {
            to: delegationManagerAddress,
            data: encodedCallData,
            value: '0x0' as `0x${string}`,
          },
        });
      }
      if (transactions.length === 0) {
        throw new Error('No transactions to add to batch');
      }

      const { batchId } = await addTransactionBatch({
        requireApproval: true,
        from: accountAddress,
        networkClientId,
        origin: 'metamask',
        securityAlertId: generateSecurityAlertId(),
        transactions,
      });

      const transactionMeta = confirmations.find(
        (conf) => (conf as { batchId?: string }).batchId === batchId,
      ) as TransactionMeta | undefined;

      if (transactionMeta) {
        setTransactionId(transactionMeta.id);
        return transactionMeta;
      }

      throw new Error('Failed to create batch transaction');
    },
    [
      confirmations,
      extractDelegationFromGatorPermissionContext,
      generateSecurityAlertId,
      isUpgraded,
      networkClientId,
      accountAddress,
      upgradeAccount,
    ],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return { revokeGatorPermission, revokeGatorPermissionBatch };
}
