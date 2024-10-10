import * as EthereumChainUtils from '../../rpc-method-middleware/handlers/ethereum-chain-utils';
import { ExternalScopeObject } from './scope';
import {
  isValidScope,
  validateScopedPropertyEip3085,
  validateScopes,
} from './validation';

jest.mock('../../rpc-method-middleware/handlers/ethereum-chain-utils', () => ({
  validateAddEthereumChainParams: jest.fn(),
}));
const MockEthereumChainUtils = jest.mocked(EthereumChainUtils);

const validScopeString = 'eip155:1';
const validScopeObject: ExternalScopeObject = {
  methods: [],
  notifications: [],
};

describe('Scope Validation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('isValidScope', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        false,
        'the scopeString is neither a CAIP namespace or CAIP chainId',
        'not a namespace or a caip chain id',
        validScopeObject,
      ],
      [
        true,
        'the scopeString is a valid CAIP namespace and the scopeObject is valid',
        'eip155',
        validScopeObject,
      ],
      [
        true,
        'the scopeString is a valid CAIP chainId and the scopeObject is valid',
        'eip155:1',
        validScopeObject,
      ],
      [
        false,
        'the scopeString is a CAIP chainId but references is nonempty',
        'eip155:1',
        {
          ...validScopeObject,
          references: ['5'],
        },
      ],
      [
        false,
        'methods contains empty string',
        validScopeString,
        {
          ...validScopeObject,
          methods: [''],
        },
      ],
      [
        false,
        'methods contains non-string',
        validScopeString,
        {
          ...validScopeObject,
          methods: [{ foo: 'bar' }],
        },
      ],
      [
        true,
        'methods contains only strings',
        validScopeString,
        {
          ...validScopeObject,
          methods: ['method1', 'method2'],
        },
      ],
      [
        false,
        'notifications contains empty string',
        validScopeString,
        {
          ...validScopeObject,
          notifications: [''],
        },
      ],
      [
        false,
        'notifications contains non-string',
        validScopeString,
        {
          ...validScopeObject,
          notifications: [{ foo: 'bar' }],
        },
      ],
      [
        false,
        'notifications contains non-string',
        'eip155:1',
        {
          ...validScopeObject,
          notifications: [{ foo: 'bar' }],
        },
      ],
      [
        false,
        'unexpected properties are defined',
        validScopeString,
        {
          ...validScopeObject,
          unexpectedParam: 'foobar',
        },
      ],
      [
        true,
        'only expected properties are defined',
        validScopeString,
        {
          references: [],
          methods: [],
          notifications: [],
          accounts: [],
          rpcDocuments: [],
          rpcEndpoints: [],
        },
      ],
    ])(
      'returns %s when %s',
      (
        expected: boolean,
        _scenario: string,
        scopeString: string,
        scopeObject: ExternalScopeObject,
      ) => {
        expect(isValidScope(scopeString, scopeObject)).toStrictEqual(expected);
      },
    );
  });

  describe('validateScopes', () => {
    const validScopeObjectWithAccounts = {
      ...validScopeObject,
      accounts: [],
    };

    it('does not throw an error if required scopes are defined but none are valid', () => {
      validateScopes(
        { 'eip155:1': {} as unknown as ExternalScopeObject },
        undefined,
      );
    });

    it('does not throw an error if optional scopes are defined but none are valid', () => {
      validateScopes(undefined, {
        'eip155:1': {} as unknown as ExternalScopeObject,
      });
    });

    it('returns the valid required and optional scopes', () => {
      expect(
        validateScopes(
          {
            'eip155:1': validScopeObjectWithAccounts,
            'eip155:64': {} as unknown as ExternalScopeObject,
          },
          {
            'eip155:2': {} as unknown as ExternalScopeObject,
            'eip155:5': validScopeObjectWithAccounts,
          },
        ),
      ).toStrictEqual({
        validRequiredScopes: {
          'eip155:1': validScopeObjectWithAccounts,
        },
        validOptionalScopes: {
          'eip155:5': validScopeObjectWithAccounts,
        },
      });
    });
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
