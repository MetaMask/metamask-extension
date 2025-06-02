import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { type Hex, hexToNumber } from '@metamask/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { parseUnits } from 'ethers/lib/utils';
import {
  Caveat,
  createDelegation,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import {
  Delegation,
  encodeDisableDelegation,
  getDelegationHashOffchain,
} from '../../../../shared/lib/delegation/delegation';
import { getSelectedNetworkClientId } from '../../../../shared/modules/selectors/networks';
import { getSelectedNetwork } from '../../../selectors';
import { getRemoteModeConfig } from '../../../selectors/remote-mode';
import { addTransaction } from '../../../store/actions';
import {
  awaitDeleteDelegationEntry,
  signDelegation,
  storeDelegationEntry,
} from '../../../store/controller-actions/delegation-controller';
import { useEIP7702Account } from '../../confirmations/hooks/useEIP7702Account';
import { useEIP7702Networks } from '../../confirmations/hooks/useEIP7702Networks';
import {
  REMOTE_MODES,
  DailyAllowance,
} from '../../../../shared/lib/remote-mode';
import { useConfirmationNavigation } from '../../confirmations/hooks/useConfirmationNavigation';
import { multiTokenPeriodBuilder } from '../../../../shared/lib/delegation/caveatBuilder/multiTokenPeriod';
import { DAY_IN_SECONDS } from '../remote.constants';

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

  const getRemoteModeDelegation = useCallback(
    (mode: REMOTE_MODES) => {
      const allowance =
        mode === REMOTE_MODES.DAILY_ALLOWANCE
          ? remoteModeConfig.dailyAllowance
          : remoteModeConfig.swapAllowance;

      if (!allowance) {
        return null;
      }

      return allowance.delegation;
    },
    [remoteModeConfig.dailyAllowance, remoteModeConfig.swapAllowance],
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

  const generateDelegation = useCallback(
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
      const caveats: Caveat[] = [];

      if (mode === REMOTE_MODES.DAILY_ALLOWANCE) {
        const parsedMeta = JSON.parse(meta ?? '{}') as {
          allowances: DailyAllowance[];
        };

        const tokenPeriodConfigs = parsedMeta.allowances.map((allowance) => {
          const amountInBaseUnit = parseUnits(
            allowance.amount.toString(),
            allowance.decimals,
          );
          return {
            token: allowance.address as Hex,
            periodAmount: amountInBaseUnit.toBigInt(),
            periodDuration: DAY_IN_SECONDS,
            // TODO: check if is the right way to get the start date or check how get latest block timestamp
            startDate: Math.floor(new Date().getTime() / 1000),
          };
        });

        caveats.push(
          multiTokenPeriodBuilder(
            getDeleGatorEnvironment(hexToNumber(chainId)),
            tokenPeriodConfigs,
          ),
        );
      }

      const delegation = createDelegation({
        caveats,
        from: selectedAccount.address as `0x${string}`,
        to: authorizedAccount.address as `0x${string}`,
      });

      const signature = await signDelegation({ delegation, chainId });

      delegation.signature = signature;

      return delegation;
    },
    [chainId],
  );

  const addDisableDelegationTransaction = useCallback(
    async ({
      delegation,
    }: {
      delegation: Delegation;
    }): Promise<TransactionMeta> => {
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

      return transactionMeta;
    },
    [account, delegationManagerAddress, globalNetworkClientId],
  );

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

      const delegation = await generateDelegation({
        selectedAccount,
        authorizedAccount,
        mode,
        meta,
      });

      storeDelegationEntry({
        delegation,
        tags: [mode],
        chainId,
        meta,
      });
    },
    [chainId, generateDelegation, upgradeAccount],
  );

  const disableRemoteMode = useCallback(
    async ({ mode }: { mode: REMOTE_MODES }): Promise<void> => {
      const delegation = getRemoteModeDelegation(mode);

      if (!delegation) {
        throw new Error('No delegation entry found');
      }

      const transactionMeta = await addDisableDelegationTransaction({
        delegation,
      });

      await awaitDeleteDelegationEntry({
        hash: getDelegationHashOffchain(delegation),
        txMeta: transactionMeta,
      });
    },
    [addDisableDelegationTransaction, getRemoteModeDelegation],
  );

  const updateRemoteMode = useCallback(
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
      const previousDelegation = getRemoteModeDelegation(mode);

      const delegation = await generateDelegation({
        selectedAccount,
        authorizedAccount,
        mode,
        meta,
      });

      const entryToStore = {
        delegation,
        tags: [mode],
        chainId,
        meta,
      };

      if (!previousDelegation) {
        return await storeDelegationEntry(entryToStore);
      }

      const transactionMeta = await addDisableDelegationTransaction({
        delegation: previousDelegation,
      });

      return await awaitDeleteDelegationEntry({
        hash: getDelegationHashOffchain(previousDelegation),
        txMeta: transactionMeta,
        entryToStore,
      });
    },
    [
      addDisableDelegationTransaction,
      chainId,
      generateDelegation,
      getRemoteModeDelegation,
    ],
  );

  return {
    enableRemoteMode,
    disableRemoteMode,
    updateRemoteMode,
    remoteModeConfig,
  };
};
