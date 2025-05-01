import { InternalAccount } from '@metamask/keyring-internal-api';
import { TransactionType } from '@metamask/transaction-controller';
import { Hex, hexToNumber } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  createDelegation,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import { encodeDisableDelegation } from '../../../../shared/lib/delegation/delegation';
import { getSelectedNetworkClientId } from '../../../../shared/modules/selectors/networks';
import { getSelectedNetwork } from '../../../selectors';
import { getRemoteModeConfig } from '../../../selectors/remote-mode';
import {
  addTransaction,
  listDelegationEntries,
  signDelegation,
  storeDelegationEntry,
} from '../../../store/actions';
import { useEIP7702Account } from '../../confirmations/hooks/useEIP7702Account';
import { useEIP7702Networks } from '../../confirmations/hooks/useEIP7702Networks';

export enum REMOTE_MODES {
  SWAP = 'swap',
  DAILY_ALLOWANCE = 'daily-allowance',
}

export const useRemoteMode = ({ account }: { account: Hex }) => {
  const { upgradeAccount: upgradeAccountEIP7702 } = useEIP7702Account();
  const { network7702List } = useEIP7702Networks(account);
  const globalNetworkClientId = useSelector(getSelectedNetworkClientId);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const { chainId } = selectedNetwork.configuration;

  const remoteModeConfig = useSelector((state) =>
    getRemoteModeConfig(state, account, {
      from: account,
      chainId,
    }),
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

  const upgradeAccount = async (): Promise<void> => {
    console.log('upgradeAccount', upgradeContractAddress);
    // TODO: remove this and use isSupported when it's ready
    if (networkConfig?.isSupported) {
      console.log('no upgrade needed');
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
  };

  const enableRemoteMode = async ({
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
  };

  const disableRemoteMode = async ({
    mode,
  }: {
    mode: REMOTE_MODES;
  }): Promise<void> => {
    const delegationEntries = await listDelegationEntries({
      tags: [mode],
      from: account,
    });

    if (delegationEntries.length === 0) {
      throw new Error('No delegation entry found');
    }

    const { delegation, meta } = delegationEntries[0];

    const metaObject = meta ? JSON.parse(meta) : {};

    // TODO: remove/unnistall toolkit and create a utils function
    const encodedCallData = encodeDisableDelegation({
      delegation,
    });

    const { batchId: revokeId } = await addTransaction(
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

    await storeDelegationEntry({
      delegation,
      tags: [mode],
      chainId,
      meta: JSON.stringify({
        ...metaObject,
        revokeId,
      }),
    });
  };

  return {
    enableRemoteMode,
    disableRemoteMode,
    remoteModeConfig,
  };
};
