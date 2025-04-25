import { Hex } from '@metamask/utils';
import { useEIP7702Account } from '../../confirmations/hooks/useEIP7702Account';
import { useEIP7702Networks } from '../../confirmations/hooks/useEIP7702Networks';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { signDelegation, storeDelegationEntry } from '../../../store/actions';
import { createDelegation } from '../../../../shared/lib/delegation';

export enum REMOTE_MODES {
  SWAP = 'swap',
  DAILY_ALLOWANCE = 'daily-allowance',
}

export const useRemoteMode = ({
  account,
  chainId,
}: {
  account: Hex;
  chainId: Hex;
}) => {
  const { upgradeAccount: upgradeAccountEIP7702 } = useEIP7702Account();
  const { network7702List } = useEIP7702Networks(account);

  const upgradeAccount = async (): Promise<void> => {
    const networkConfig = network7702List.find(
      (network) => network.chainIdHex === chainId,
    );

    // TODO: remove this and use isSupported when it's ready
    if (networkConfig?.isSupported) {
      console.log('no upgrade needed');
      return;
    }

    if (!networkConfig?.upgradeContractAddress) {
      throw new Error('No upgrade contract address found');
    }

    await upgradeAccountEIP7702(account, networkConfig?.upgradeContractAddress);
  };

  const enableRemoteMode = async ({
    selectedAccount,
    authorizedAccount,
    mode,
  }: {
    selectedAccount: InternalAccount;
    authorizedAccount: InternalAccount;
    mode: REMOTE_MODES;
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
    });
  };

  return { enableRemoteMode };
};
