import { DELEGATOR_CONTRACTS } from '@metamask/delegation-toolkit';
import { Hex, hexToNumber } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import { getNetworkConfigurationIdByChainId } from '../../../selectors';
import { addTransaction, estimateGas } from '../../../store/actions';
import {
  TransactionEnvelopeType,
  TransactionType,
} from '@metamask/transaction-controller';
import { getEIP7702ContractAddresses } from '../../../selectors/remote-mode';

/* export function getEIP7702ContractAddresses(
  chainId: Hex,
  publicKey: Hex,
): Hex[] {
  const featureFlags = getFeatureFlags(messenger);

  const contracts =
    featureFlags?.[FeatureFlag.EIP7702]?.contracts?.[
      chainId.toLowerCase() as Hex
    ] ?? [];

  return contracts
    .filter((contract) =>
      isValidSignature(
        [contract.address, padHexToEvenLength(chainId) as Hex],
        contract.signature,
        publicKey,
      ),
    )
    .map((contract) => contract.address);
} */

export default function useUpgradeAccount() {
  const networkGasFeeEstimates = useSelector(getGasFeeEstimates);
  const networkConfigurationIds = useSelector(
    getNetworkConfigurationIdByChainId,
  );
  const isRemoteModeEnabled = useSelector(getEIP7702ContractAddresses);

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
      type: TransactionEnvelopeType.setCode,
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

    console.log('txParams', JSON.stringify(txParams));

    const maxGasLimit = await estimateGas({
      from: txParams.from,
      to: txParams.to,
      value: txParams.value,
      data: txParams.data,
      authorizationList: txParams.authorizationList,
    });

    const finalTxParams = {
      ...txParams,
      chainId,
      gasLimit: maxGasLimit,
      gas: maxGasLimit,
    };

    console.log('finalTxParams', finalTxParams);

    const networkClientId =
      networkConfigurationIds[chainId as keyof typeof networkConfigurationIds];

    console.log('networkClientId', networkClientId);

    const txMeta = await addTransaction(finalTxParams, {
      requireApproval: true,
      networkClientId,
    });

    console.log('txMeta', txMeta);

    return txMeta;
  };

  return {
    upgradeAccount,
  };
}
