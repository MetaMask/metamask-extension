import { Hex } from '@metamask/utils';
import { useEIP7702Account } from '../../confirmations/hooks/useEIP7702Account';
import { useEIP7702Networks } from '../../confirmations/hooks/useEIP7702Networks';

export default function useUpgradeAccount({ account }: { account: Hex }) {
  const { upgradeAccount: upgradeAccountEIP7702 } = useEIP7702Account();
  const { network7702List } = useEIP7702Networks(account);

  const upgradeAccount = async ({
    chainId,
  }: {
    chainId: Hex;
  }): Promise<void> => {
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

  return {
    upgradeAccount,
  };
}
