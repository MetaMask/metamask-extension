import { DELEGATOR_CONTRACTS } from '@metamask/delegation-toolkit';
import { Hex, hexToNumber } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import { getNetworkConfigurationIdByChainId } from '../../../selectors';
import { addTransaction } from '../../../store/actions';
import { TransactionType } from '@metamask/transaction-controller';

export default function useUpgradeAccount() {
  const networkGasFeeEstimates = useSelector(getGasFeeEstimates);
  const networkConfigurationIds = useSelector(
    getNetworkConfigurationIdByChainId,
  );

  const upgradeAccount = async ({
    account,
    chainId,
    gasLimit,
  }: {
    account: string;
    chainId: Hex;
    gasLimit: number | null;
  }) => {
    // TODO: Change this to get address from Launch Darkly
    const statelessDelegatorImplementation =
      DELEGATOR_CONTRACTS['1.3.0'][hexToNumber(chainId)]
        .EIP7702StatelessDeleGatorImpl;

    const txParams = {
      type: '0x4',
      from: account,
      to: account,
      value: '0x0',
      authorizationList: [
        {
          chainId,
          address: statelessDelegatorImplementation,
        },
      ],
      chainId: hexToNumber(chainId),
      data: '0x',
      gasLimit: gasLimit ?? 0,
    };

    console.log(networkGasFeeEstimates);

    // TODO: Remove this once we have a way to get the gas limit
    const maxGasLimit = '0xc3b0'; //getHexMaxGasLimit(txParams.gasLimit ?? 0);

    const finalTxParams = {
      ...txParams,
      chainId,
      gasLimit: maxGasLimit,
      gas: maxGasLimit,
    };

    console.log('finalTxParams', finalTxParams);

    const networkClientId =
      networkConfigurationIds[chainId as keyof typeof networkConfigurationIds];

    const txMeta = await addTransaction(finalTxParams, {
      requireApproval: true,
      networkClientId,
      type: TransactionType.simpleSend,
    });

    return txMeta;
  };

  return {
    upgradeAccount,
  };
}
