import { addHexPrefixToObjectValues } from '../../../helpers/utils/util';
import { TOKEN_TRANSFER_FUNCTION_SIGNATURE } from '../send.constants';

import {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
} from './send-footer.utils';

jest.mock('ethereumjs-abi', () => ({
  rawEncode: jest.fn((arr1, arr2) => {
    return [...arr1, ...arr2];
  }),
}));

describe('send-footer utils', () => {
  describe('addHexPrefixToObjectValues()', () => {
    it('should return a new object with the same properties with a 0x prefix', () => {
      expect(
        addHexPrefixToObjectValues({
          prop1: '0x123',
          prop2: '456',
          prop3: 'x',
        }),
      ).toStrictEqual({
        prop1: '0x123',
        prop2: '0x456',
        prop3: '0xx',
      });
    });
  });

  describe('addressIsNew()', () => {
    it('should return false if the address exists in toAccounts', () => {
      expect(
        addressIsNew(
          [{ address: '0xabc' }, { address: '0xdef' }, { address: '0xghi' }],
          '0xdef',
        ),
      ).toStrictEqual(false);
    });

    it('should return true if the address does not exists in toAccounts', () => {
      expect(
        addressIsNew(
          [{ address: '0xabc' }, { address: '0xdef' }, { address: '0xghi' }],
          '0xxyz',
        ),
      ).toStrictEqual(true);
    });
  });

  describe('constructTxParams()', () => {
    it('should return a new txParams object with data if there data is given', () => {
      expect(
        constructTxParams({
          data: 'someData',
          sendToken: undefined,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
      ).toStrictEqual({
        data: '0xsomeData',
        to: '0xmockTo',
        value: '0xmockAmount',
        from: '0xmockFrom',
        gas: '0xmockGas',
        gasPrice: '0xmockGasPrice',
      });
    });

    it('should return a new txParams object with value and to properties if there is no sendToken', () => {
      expect(
        constructTxParams({
          sendToken: undefined,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
      ).toStrictEqual({
        data: undefined,
        to: '0xmockTo',
        value: '0xmockAmount',
        from: '0xmockFrom',
        gas: '0xmockGas',
        gasPrice: '0xmockGasPrice',
      });
    });

    it('should return a new txParams object without a to property and a 0 value if there is a sendToken', () => {
      expect(
        constructTxParams({
          sendToken: { address: '0x0' },
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
      ).toStrictEqual({
        data: undefined,
        value: '0x0',
        from: '0xmockFrom',
        gas: '0xmockGas',
        gasPrice: '0xmockGasPrice',
      });
    });
  });

  describe('constructUpdatedTx()', () => {
    it('should return a new object with an updated txParams', () => {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        sendToken: false,
        to: 'mockTo',
        unapprovedTxs: {
          '0x123': {},
          '0x456': {
            unapprovedTxParam: 'someOtherParam',
            txParams: {
              data: 'someData',
            },
          },
        },
      });
      expect(result).toStrictEqual({
        unapprovedTxParam: 'someOtherParam',
        txParams: {
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
          value: '0xmockAmount',
          to: '0xmockTo',
          data: '0xsomeData',
        },
      });
    });

    it('should not have data property if there is non in the original tx', () => {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        sendToken: false,
        to: 'mockTo',
        unapprovedTxs: {
          '0x123': {},
          '0x456': {
            unapprovedTxParam: 'someOtherParam',
            txParams: {
              from: 'oldFrom',
              gas: 'oldGas',
              gasPrice: 'oldGasPrice',
            },
          },
        },
      });

      expect(result).toStrictEqual({
        unapprovedTxParam: 'someOtherParam',
        txParams: {
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
          value: '0xmockAmount',
          to: '0xmockTo',
        },
      });
    });

    it('should have token property values if sendToken is truthy', () => {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        sendToken: {
          address: 'mockTokenAddress',
        },
        to: 'mockTo',
        unapprovedTxs: {
          '0x123': {},
          '0x456': {
            unapprovedTxParam: 'someOtherParam',
            txParams: {},
          },
        },
      });

      expect(result).toStrictEqual({
        unapprovedTxParam: 'someOtherParam',
        txParams: {
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
          value: '0x0',
          to: '0xmockTokenAddress',
          data: `${TOKEN_TRANSFER_FUNCTION_SIGNATURE}ss56Tont`,
        },
      });
    });
  });
});
