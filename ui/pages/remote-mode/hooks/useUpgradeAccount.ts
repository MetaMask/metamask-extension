import { DELEGATOR_CONTRACTS } from '@metamask/delegation-toolkit';
import { Hex, hexToNumber } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import { getNetworkConfigurationIdByChainId } from '../../../selectors';
import { addTransaction, estimateGas } from '../../../store/actions';
import { TransactionType } from '@metamask/transaction-controller';

export default function useUpgradeAccount() {
  const networkGasFeeEstimates = useSelector(getGasFeeEstimates);
  const networkConfigurationIds = useSelector(
    getNetworkConfigurationIdByChainId,
  );

  const upgradeAccount = async ({
    account,
    chainId,
  }: {
    account: string;
    chainId: Hex;
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
      chainId,
      data: '0x',
    };

    const maxGasLimit = await estimateGas(txParams);

    const finalTxParams = {
      ...txParams,
      chainId,
      gasLimit: maxGasLimit,
      gas: maxGasLimit,
    };

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
