import type { InternalAccount } from '@metamask/keyring-internal-api';
import { TransactionType } from '@metamask/transaction-controller';
import { type Hex, hexToNumber } from '@metamask/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  createDelegation,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import {
  encodeDisableDelegation,
  getDelegationHashOffchain,
} from '../../../../shared/lib/delegation/delegation';
import { getSelectedNetworkClientId } from '../../../../shared/modules/selectors/networks';
import { getSelectedNetwork } from '../../../selectors';
import { getRemoteModeConfig } from '../../../selectors/remote-mode';
import { addTransaction } from '../../../store/actions';
import {
  awaitDeleteDelegationEntry,
  listDelegationEntries,
  signDelegation,
  storeDelegationEntry,
} from '../../../store/controller-actions/delegation-controller';
import { useEIP7702Account } from '../../confirmations/hooks/useEIP7702Account';
import { useEIP7702Networks } from '../../confirmations/hooks/useEIP7702Networks';
import { REMOTE_MODES } from '../remote.types';
import { useConfirmationNavigation } from '../../confirmations/hooks/useConfirmationNavigation';

export const useRemoteMode = ({ account }: { account: Hex }) => {
  const { network7702List } = useEIP7702Networks(account);
  const globalNetworkClientId = useSelector(getSelectedNetworkClientId);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const { chainId } = selectedNetwork.configuration;
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();

  const isRedirectPending = useMemo(() => {
    return confirmations.some((conf) => conf.id === transactionId);
  }, [confirmations, transactionId]);

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
    }
  }, [isRedirectPending, navigateToId, transactionId]);

  const { upgradeAccount: upgradeAccountEIP7702 } = useEIP7702Account({
    chainId,
  });

  const remoteModeConfig = useSelector((state) =>
    getRemoteModeConfig(state, account, chainId),
  );

  const upgradeContractAddress = useMemo(() => {
    return getDeleGatorEnvironment(hexToNumber(chainId))
      .EIP7702StatelessDeleGatorImpl;
  }, [chainId]);

  const delegationManagerAddress = useMemo(() => {
    return getDeleGatorEnvironment(hexToNumber(chainId)).DelegationManager;
  }, [chainId]);

  const networkConfig = useMemo(
    () => network7702List.find((network) => network.chainIdHex === chainId),
    [network7702List, chainId],
  );

  const upgradeAccount = useCallback(async () => {
    // TODO: remove this and use isSupported when it's ready
    if (networkConfig?.isSupported) {
      return;
    }

    if (!networkConfig?.upgradeContractAddress && !upgradeContractAddress) {
      throw new Error('No upgrade contract address found');
    }

    if (networkConfig?.upgradeContractAddress) {
      await upgradeAccountEIP7702(
        account,
        networkConfig?.upgradeContractAddress,
      );
    } else {
      await upgradeAccountEIP7702(account, upgradeContractAddress);
    }
  }, [
    account,
    networkConfig?.isSupported,
    networkConfig?.upgradeContractAddress,
    upgradeAccountEIP7702,
    upgradeContractAddress,
  ]);

  const enableRemoteMode = useCallback(
    async ({
      selectedAccount,
      authorizedAccount,
      mode,
      meta,
    }: {
      selectedAccount: InternalAccount;
      authorizedAccount: InternalAccount;
      mode: REMOTE_MODES;
      meta?: string;
    }) => {
      await upgradeAccount();

      const delegation = createDelegation({
        caveats: [],
        from: selectedAccount.address as `0x${string}`,
        to: authorizedAccount.address as `0x${string}`,
      });

      const signature = await signDelegation({ delegation, chainId });

      delegation.signature = signature;

      storeDelegationEntry({
        delegation,
        tags: [mode],
        chainId,
        meta,
      });
    },
    [chainId, upgradeAccount],
  );

  const disableRemoteMode = useCallback(
    async ({ mode }: { mode: REMOTE_MODES }): Promise<void> => {
      const delegationEntries = await listDelegationEntries({
        from: account,
        tags: [mode],
      });

      if (delegationEntries.length === 0) {
        throw new Error('No delegation entry found');
      }

      const { delegation } = delegationEntries[0];

      const encodedCallData = encodeDisableDelegation({
        delegation,
      });

      const transactionMeta = await addTransaction(
        {
          from: account,
          to: delegationManagerAddress,
          data: encodedCallData,
          value: '0x0',
        },
        {
          networkClientId: globalNetworkClientId,
          type: TransactionType.contractInteraction,
        },
      );

      setTransactionId(transactionMeta.id);

      await awaitDeleteDelegationEntry({
        hash: getDelegationHashOffchain(delegation),
        txMeta: transactionMeta,
      });
    },
    [account, delegationManagerAddress, globalNetworkClientId],
  );

  return {
    enableRemoteMode,
    disableRemoteMode,
    remoteModeConfig,
  };
};
