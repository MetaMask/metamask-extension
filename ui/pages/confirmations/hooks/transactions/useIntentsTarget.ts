import { toHex } from '@metamask/controller-utils';
import { useConfirmContext } from '../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { Hex } from '@metamask/utils';

const USRC_ARBITRUM = '0xaf88d065e77c8cc2239327c5edb3a432268e5831' as const;

export function useIntentsTarget() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { txParams } = transactionMeta;
  const { data } = txParams;

  let targetAmount: Hex = '0x0';

  try {
    const result = new Interface(abiERC20).decodeFunctionData(
      'transfer',
      data ?? '0x',
    );

    targetAmount = toHex(result['_value']);
  } catch {}

  return {
    targetTokenAddress: USRC_ARBITRUM,
    targetAmount,
  };
}
