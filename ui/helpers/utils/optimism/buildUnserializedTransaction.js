import { omit } from 'lodash';
import { BN } from 'ethereumjs-util';
import { Common, Hardfork } from '@ethereumjs/common';
import { TransactionFactory } from '@ethereumjs/tx';
import { stripHexPrefix } from '../../../../shared/modules/hexstring-utils';

function buildTxParams(txMeta) {
  return {
    ...omit(txMeta.txParams, 'gas'),
    gasLimit: txMeta.txParams.gas,
  };
}

function buildTransactionCommon(txMeta) {
  // This produces a transaction whose information does not completely match an
  // Optimism transaction — for instance, DEFAULT_CHAIN is still 'mainnet' and
  // genesis points to the mainnet genesis, not the Optimism genesis — but
  // considering that all we want to do is serialize a transaction, this works
  // fine for our use case.
  return Common.custom({
    chainId: new BN(stripHexPrefix(txMeta.chainId), 16),
    // Optimism only supports type-0 transactions; it does not support any of
    // the newer EIPs since EIP-155. Source:
    // <https://github.com/ethereum-optimism/optimism/blob/develop/specs/l2geth/transaction-types.md>
    defaultHardfork: Hardfork.London,
  });
}

export default function buildUnserializedTransaction(txMeta) {
  const txParams = buildTxParams(txMeta);
  const common = buildTransactionCommon(txMeta);
  return TransactionFactory.fromTxData(txParams, { common });
}
