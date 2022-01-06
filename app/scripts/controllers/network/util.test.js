import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  TRANSACTION_ENVELOPE_TYPES,
} from '../../../../shared/constants/transaction';

import { formatTxMetaForRpcResult } from './util';

describe('network utils', () => {
  describe('formatTxMetaForRpcResult', () => {
    it('should correctly format the tx meta object (EIP-1559)', () => {
      const txMeta = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          maxFeePerGas: '0x77359400',
          maxPriorityFeePerGas: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TRANSACTION_TYPES.SIMPLE_SEND,
        origin: 'other',
        chainId: '0x3',
        time: 1624408066355,
        metamaskNetworkId: '3',
        hash:
          '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        v: '0x29',
      };
      const expectedResult = {
        accessList: null,
        blockHash: null,
        blockNumber: null,
        from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        gas: '0x7b0d',
        gasPrice: '0x77359400',
        hash:
          '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        input: '0x',
        maxFeePerGas: '0x77359400',
        maxPriorityFeePerGas: '0x77359400',
        nonce: '0x4b',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        transactionIndex: null,
        type: '0x2',
        v: '0x29',
        value: '0x0',
      };
      const result = formatTxMetaForRpcResult(txMeta);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should correctly format the tx meta object (non EIP-1559)', () => {
      const txMeta = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TRANSACTION_TYPES.SIMPLE_SEND,
        origin: 'other',
        chainId: '0x3',
        time: 1624408066355,
        metamaskNetworkId: '3',
        hash:
          '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        v: '0x29',
      };
      const expectedResult = {
        accessList: null,
        blockHash: null,
        blockNumber: null,
        from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        gas: '0x7b0d',
        hash:
          '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        input: '0x',
        gasPrice: '0x77359400',
        nonce: '0x4b',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        transactionIndex: null,
        type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
        v: '0x29',
        value: '0x0',
      };
      const result = formatTxMetaForRpcResult(txMeta);
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
