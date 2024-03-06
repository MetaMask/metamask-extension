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
  // any L2 transaction — for instance, DEFAULT_CHAIN is still 'mainnet' and
  // genesis points to the mainnet genesis, not the L2 genesis — but
  // considering that all we want to do is serialize a transaction, this works
  // fine for our use case.
  return Common.custom({
    chainId: new BN(stripHexPrefix(txMeta.chainId), 16),
    // Scroll only supports type-0 transactions, while OP Stack chains can support
    // type-2 transactions. Both are supported here.
    // Sources:
    // <https://community.optimism.io/docs/developers/build/transaction-fees/#the-l2-execution-fee>
    // <https://docs.scroll.io/en/developers/ethereum-and-scroll-differences/#user-content-fnref-eip1559>
    defaultHardfork: Hardfork.London,
  });
}

export default function buildUnserializedTransaction(txMeta, signed = false) {
  const txParams = buildTxParams(txMeta);
  const common = buildTransactionCommon(txMeta);
  let unserializedTransaction = TransactionFactory.fromTxData(txParams, {
    common,
  });

  // Different Gas Oracle contracts have different requirements for using signed or unsigned transactions.
  if (signed) {
    // Since this is just for signature formatting, we can use a fake key here.
    const temporaryKey = Buffer.from(
      'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      'hex',
    );
    unserializedTransaction = unserializedTransaction.sign(temporaryKey);
  }

  return unserializedTransaction;
}
