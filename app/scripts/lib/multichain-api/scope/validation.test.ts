import * as EthereumChainUtils from '../../rpc-method-middleware/handlers/ethereum-chain-utils';
import { validateScopedPropertyEip3085 } from './validation';

jest.mock('../../rpc-method-middleware/handlers/ethereum-chain-utils', () => ({
  validateAddEthereumChainParams: jest.fn(),
}));
const MockEthereumChainUtils = jest.mocked(EthereumChainUtils);

describe('Scope Validation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateScopedPropertyEip3085', () => {
    it('throws an error if eip3085 params are not provided', () => {
      expect(() => validateScopedPropertyEip3085('', undefined)).toThrow(
        new Error('eip3085 params are missing'),
      );
    });

    it('throws an error if the scopeString is not a CAIP chain ID', () => {
      expect(() => validateScopedPropertyEip3085('eip155', {})).toThrow(
        new Error('scopeString is malformed'),
      );
    });

    it('throws an error if the namespace is not eip155', () => {
      expect(() => validateScopedPropertyEip3085('wallet:1', {})).toThrow(
        new Error('namespace is not eip155'),
      );
    });

    it('validates the 3085 params', () => {
      try {
        validateScopedPropertyEip3085('eip155:1', { foo: 'bar' });
      } catch (err) {
        // noop
      }
      expect(
        MockEthereumChainUtils.validateAddEthereumChainParams,
      ).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('throws an error if the 3085 params are invalid', () => {
      MockEthereumChainUtils.validateAddEthereumChainParams.mockImplementation(
        () => {
          throw new Error('invalid eth chain params');
        },
      );
      expect(() =>
        validateScopedPropertyEip3085('eip155:1', { foo: 'bar' }),
      ).toThrow(new Error('invalid eth chain params'));
    });

    it('throws an error if the 3085 params chainId does not match the reference', () => {
      MockEthereumChainUtils.validateAddEthereumChainParams.mockReturnValue({
        chainId: '0x5',
        chainName: 'test',
        firstValidBlockExplorerUrl: 'http://explorer.test.com',
        firstValidRPCUrl: 'http://rpc.test.com',
        ticker: 'TST',
      });
      expect(() =>
        validateScopedPropertyEip3085('eip155:1', { foo: 'bar' }),
      ).toThrow(new Error('eip3085 chainId does not match reference'));
    });
    it('returns the validated 3085 params when valid', () => {
      MockEthereumChainUtils.validateAddEthereumChainParams.mockReturnValue({
        chainId: '0x1',
        chainName: 'test',
        firstValidBlockExplorerUrl: 'http://explorer.test.com',
        firstValidRPCUrl: 'http://rpc.test.com',
        ticker: 'TST',
      });
      expect(
        validateScopedPropertyEip3085('eip155:1', { foo: 'bar' }),
      ).toStrictEqual({
        chainId: '0x1',
        chainName: 'test',
        firstValidBlockExplorerUrl: 'http://explorer.test.com',
        firstValidRPCUrl: 'http://rpc.test.com',
        ticker: 'TST',
      });
    });
  });
});
