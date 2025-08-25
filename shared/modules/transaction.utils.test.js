import { TransactionType } from '@metamask/transaction-controller';

import BigNumber from 'bignumber.js';
import { createTestProviderTools } from '../../test/stub/provider';
import {
  buildApproveTransactionData,
  buildIncreaseAllowanceTransactionData,
  buildPermit2ApproveTransactionData,
} from '../../test/data/confirmations/token-approve';
import { buildSetApproveForAllTransactionData } from '../../test/data/confirmations/set-approval-for-all';
import {
  determineTransactionType,
  hasTransactionData,
  isEIP1559Transaction,
  isLegacyTransaction,
  parseApprovalTransactionData,
  parseStandardTokenTransactionData,
  parseTypedDataMessage,
} from './transaction.utils';

const DATA_MOCK = '0x12345678';
const ADDRESS_MOCK = '0x1234567890123456789012345678901234567890';
const ADDRESS_2_MOCK = '0x1234567890123456789012345678901234567891';
const EXPIRATION_MOCK = 1234567890;
const AMOUNT_MOCK = 123;

describe('Transaction.utils', function () {
  describe('parseStandardTokenTransactionData', () => {
    it('should return token data', () => {
      const tokenData = parseStandardTokenTransactionData(
        '0xa9059cbb00000000000000000000000050a9d56c2b8ba9a5c7f2c08c3d26e0499f23a7060000000000000000000000000000000000000000000000000000000000004e20',
      );
      expect(tokenData).toStrictEqual(expect.anything());
      const { name, args } = tokenData;
      expect(name).toStrictEqual(TransactionType.tokenMethodTransfer);
      const to = args._to;
      const value = args._value.toString();
      expect(to).toStrictEqual('0x50A9D56C2B8BA9A5c7f2C08C3d26E0499F23a706');
      expect(value).toStrictEqual('20000');
    });

    it('should not throw errors when called without arguments', () => {
      expect(() => parseStandardTokenTransactionData()).not.toThrow();
    });

    it('decodes Permit2 function', () => {
      const result = parseStandardTokenTransactionData(
        buildPermit2ApproveTransactionData(
          ADDRESS_MOCK,
          ADDRESS_2_MOCK,
          AMOUNT_MOCK,
          EXPIRATION_MOCK,
        ),
      );

      expect(result.name).toBe('approve');
      expect(result.args).toStrictEqual(
        expect.objectContaining({
          token: ADDRESS_MOCK,
          spender: ADDRESS_2_MOCK,
          expiration: EXPIRATION_MOCK,
        }),
      );
      expect(result.args.amount.toString()).toBe(AMOUNT_MOCK.toString());
    });
  });

  describe('isEIP1559Transaction', function () {
    it('should return true if both maxFeePerGas and maxPriorityFeePerGas are hex strings', () => {
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: '0x1', maxPriorityFeePerGas: '0x1' },
        }),
      ).toBe(true);
    });

    it('should return false if either maxFeePerGas and maxPriorityFeePerGas are non-hex strings', () => {
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: 0, maxPriorityFeePerGas: '0x1' },
        }),
      ).toBe(false);
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: '0x1', maxPriorityFeePerGas: 'fail' },
        }),
      ).toBe(false);
    });

    it('should return false if either maxFeePerGas or maxPriorityFeePerGas are not supplied', () => {
      expect(
        isEIP1559Transaction({
          txParams: { maxPriorityFeePerGas: '0x1' },
        }),
      ).toBe(false);
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: '0x1' },
        }),
      ).toBe(false);
    });
  });

  describe('isLegacyTransaction', function () {
    it('should return true if no gas related fields are supplied', () => {
      expect(
        isLegacyTransaction({
          txParams: {},
        }),
      ).toBe(true);
    });

    it('should return true if gasPrice is solely provided', () => {
      expect(
        isLegacyTransaction({
          txParams: { gasPrice: '0x1' },
        }),
      ).toBe(true);
    });

    it('should return false if gasPrice is not a hex string', () => {
      expect(
        isLegacyTransaction({
          txParams: { gasPrice: 100 },
        }),
      ).toBe(false);
    });

    it('should return false if either maxFeePerGas or maxPriorityFeePerGas are supplied', () => {
      expect(
        isLegacyTransaction({
          txParams: {
            maxFeePerGas: '0x1',
          },
        }),
      ).toBe(false);

      expect(
        isLegacyTransaction({
          txParams: {
            maxPriorityFeePerGas: 'any data',
          },
        }),
      ).toBe(false);
    });
  });

  describe('determineTransactionType', function () {
    const { provider: genericProvider } = createTestProviderTools();

    it('should return a simple send type when to is truthy and is not a contract address', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0x',
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0xabcabcabcabcabcabcabcabcabcabcabcabcabca',
          data: '',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.simpleSend,
        getCodeResponse: '0x',
      });
    });

    it('should return a token transfer type when the recipient is a contract, there is no value passed, and data is for the respective method call', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xab',
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.tokenMethodTransfer,
        getCodeResponse: '0xab',
      });
    });

    it(
      'should NOT return a token transfer type and instead return contract interaction' +
        ' when the recipient is a contract, the data matches the respective method call, but there is a value passed',
      async function () {
        const _providerResultStub = {
          // 1 gwei
          eth_gasPrice: '0x0de0b6b3a7640000',
          // by default, all accounts are external accounts (not contracts)
          eth_getCode: '0xab',
        };
        const { provider } = createTestProviderTools({
          scaffold: _providerResultStub,
        });

        const resultWithEmptyValue = await determineTransactionType(
          {
            value: '0x0',
            to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
            data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
          },
          provider,
        );
        expect(resultWithEmptyValue).toMatchObject({
          type: TransactionType.tokenMethodTransfer,
          getCodeResponse: '0xab',
        });

        const resultWithEmptyValue2 = await determineTransactionType(
          {
            value: '0x0000',
            to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
            data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
          },
          provider,
        );

        expect(resultWithEmptyValue2).toMatchObject({
          type: TransactionType.tokenMethodTransfer,
          getCodeResponse: '0xab',
        });

        const resultWithValue = await determineTransactionType(
          {
            value: '0x12345',
            to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
            data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
          },
          provider,
        );
        expect(resultWithValue).toMatchObject({
          type: TransactionType.contractInteraction,
          getCodeResponse: '0xab',
        });
      },
    );

    it('should NOT return a token transfer type when the recipient is not a contract but the data matches the respective method call', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0x',
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.simpleSend,
        getCodeResponse: '0x',
      });
    });

    it('should return a token approve type when when the recipient is a contract and data is for the respective method call', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xab',
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          data: '0x095ea7b30000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C9700000000000000000000000000000000000000000000000000000000000000005',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.tokenMethodApprove,
        getCodeResponse: '0xab',
      });
    });

    it('should return a contract deployment type when to is falsy and there is data', async function () {
      const result = await determineTransactionType(
        {
          to: '',
          data: '0xabd',
        },
        genericProvider,
      );
      expect(result).toMatchObject({
        type: TransactionType.deployContract,
        getCodeResponse: undefined,
      });
    });

    it('should return a simple send type with a 0x getCodeResponse when there is data and but the to address is not a contract address', async function () {
      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          data: '0xabd',
        },
        genericProvider,
      );
      expect(result).toMatchObject({
        type: TransactionType.simpleSend,
        getCodeResponse: '0x',
      });
    });

    it('should return a simple send type with a null getCodeResponse when to is truthy and there is data and but getCode returns an error', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: null,
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          data: '0xabd',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.simpleSend,
        getCodeResponse: null,
      });
    });

    it('should return a contract interaction type with the correct getCodeResponse when to is truthy and there is data and it is not a token transaction', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xa',
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          data: 'abd',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.contractInteraction,
        getCodeResponse: '0x0a',
      });
    });

    it('should return a contract interaction type with the correct getCodeResponse when to is a contract address and data is falsy', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xa',
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          data: '',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.contractInteraction,
        getCodeResponse: '0x0a',
      });
    });

    it('should return contractInteraction for send with approve', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xa',
      };
      const { provider } = createTestProviderTools({
        scaffold: _providerResultStub,
      });

      const result = await determineTransactionType(
        {
          to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
          value: '0x5af3107a4000',
          data: '0x095ea7b30000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C9700000000000000000000000000000000000000000000000000000000000000005',
        },
        provider,
      );
      expect(result).toMatchObject({
        type: TransactionType.contractInteraction,
        getCodeResponse: '0x0a',
      });
    });

    describe('parseTypedDataMessage', () => {
      const domainTypes = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ];

      const baseObject = {
        types: {
          EIP712Domain: domainTypes,
        },
        primaryType: 'Mail',
      };

      const makeFullMessage = (message) => ({
        ...baseObject,
        message,
      });

      const parse = (input) => parseTypedDataMessage(input);

      describe('valid JSON strings', () => {
        it('parses basic JSON string', () => {
          const result = parse('{"test": "dummy"}');
          expect(result.test).toBe('dummy');
        });

        it('parses message.value and coerces to string (small number)', () => {
          const input = '{"message": { "value": 3000123 }}';
          const result = parse(input);
          expect(result.message.value).toBe('3000123');
        });

        it('parses message.value without losing precision (large number)', () => {
          const input = '{"message": { "value": 30001231231212312138768 }}';
          const result = parse(input);
          expect(result.message.value).toBe('30001231231212312138768');
        });

        it('parses and retains nested message structure', () => {
          const input = JSON.stringify(
            makeFullMessage({ nested: { field: 'value' } }),
          );
          const result = parse(input);
          expect(result).toStrictEqual(
            makeFullMessage({ nested: { field: 'value' } }),
          );
        });

        it('preserves message.value if already a string', () => {
          const inputObject = makeFullMessage({ value: '123' });
          const result = parse(JSON.stringify(inputObject));
          expect(result).toStrictEqual(inputObject);
        });
      });

      describe('primitive non-object inputs', () => {
        it.each([
          ['number', 123],
          ['boolean', true],
        ])('returns input when input is %s', (_, value) => {
          const result = parse(value);
          expect(result).toBe(value);
        });
      });

      describe('object input', () => {
        it('returns the input directly if it is already an object', () => {
          const obj = makeFullMessage({
            from: { name: 'Alice', wallet: '0x123' },
            to: { name: 'Bob', wallet: '0x456' },
            contents: 'Hello, Bob!',
          });
          const result = parse(obj);
          expect(result).toBe(obj);
        });
      });

      describe('invalid inputs', () => {
        it('throws on empty string', () => {
          expect(() => parse('')).toThrow('Unexpected end of JSON input');
        });

        it('throws on non-JSON string', () => {
          expect(() => parse('invalid-json')).toThrow(
            `Unexpected token 'i', "invalid-json" is not valid JSON`,
          );
        });
      });
    });
  });

  describe('hasTransactionData', () => {
    it.each([
      ['has prefix', '0x1234'],
      ['has no prefix', '1234'],
    ])('returns true if data %s', (_, data) => {
      expect(hasTransactionData(data)).toBe(true);
    });

    it.each([undefined, null, '', '0x', '0X'])(
      'returns false if data is %s',
      (data) => {
        expect(hasTransactionData(data)).toBe(false);
      },
    );
  });

  describe('parseApprovalTransactionData', () => {
    it('returns undefined if function does not match', () => {
      expect(parseApprovalTransactionData(DATA_MOCK)).toBeUndefined();
    });

    it('returns parsed data if approve', () => {
      expect(
        parseApprovalTransactionData(
          buildApproveTransactionData(ADDRESS_MOCK, AMOUNT_MOCK),
        ),
      ).toStrictEqual({
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isApproveAll: false,
        isRevokeAll: false,
        name: 'approve',
        spender: '0x1234567890123456789012345678901234567890',
        tokenAddress: undefined,
      });
    });

    it('returns parsed data if increaseAllowance', () => {
      expect(
        parseApprovalTransactionData(
          buildIncreaseAllowanceTransactionData(ADDRESS_MOCK, AMOUNT_MOCK),
        ),
      ).toStrictEqual({
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isApproveAll: false,
        isRevokeAll: false,
        name: 'increaseAllowance',
        spender: ADDRESS_MOCK,
        tokenAddress: undefined,
      });
    });

    it('returns parsed data if approved setApproveForAll', () => {
      expect(
        parseApprovalTransactionData(
          buildSetApproveForAllTransactionData(ADDRESS_MOCK, true),
        ),
      ).toStrictEqual({
        amountOrTokenId: undefined,
        isApproveAll: true,
        isRevokeAll: false,
        name: 'setApprovalForAll',
        spender: ADDRESS_MOCK,
        tokenAddress: undefined,
      });
    });

    it('returns parsed data if revoked setApproveForAll', () => {
      expect(
        parseApprovalTransactionData(
          buildSetApproveForAllTransactionData(ADDRESS_MOCK, false),
        ),
      ).toStrictEqual({
        amountOrTokenId: undefined,
        isApproveAll: false,
        isRevokeAll: true,
        name: 'setApprovalForAll',
        spender: ADDRESS_MOCK,
        tokenAddress: undefined,
      });
    });

    it('returns parsed data if Permit2 approve', () => {
      expect(
        parseApprovalTransactionData(
          buildPermit2ApproveTransactionData(
            ADDRESS_MOCK,
            ADDRESS_2_MOCK,
            AMOUNT_MOCK,
            EXPIRATION_MOCK,
          ),
        ),
      ).toStrictEqual({
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isApproveAll: false,
        isRevokeAll: false,
        name: 'approve',
        spender: ADDRESS_2_MOCK,
        tokenAddress: ADDRESS_MOCK,
      });
    });
  });
});
