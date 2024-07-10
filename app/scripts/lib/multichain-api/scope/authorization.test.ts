import * as Validation from './validation';
import * as Transform from './transform';
import * as Assert from './assert';
import { processScopes } from './authorization';
import { ScopeObject } from './scope';

jest.mock('./validation', () => ({
  validateScopes: jest.fn(),
}));
const MockValidation = jest.mocked(Validation);

jest.mock('./transform', () => ({
  flattenMergeScopes: jest.fn(),
}));
const MockTransform = jest.mocked(Transform);

jest.mock('./assert', () => ({
  assertScopesSupported: jest.fn(),
}));
const MockAssert = jest.mocked(Assert);

const validScopeObject: ScopeObject = {
  methods: [],
  notifications: [],
};

describe('Scope Authorization', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processScopes', () => {
    const findNetworkClientIdByChainId = jest.fn();
    const getInternalAccounts = jest.fn();

    it('validates the scopes', () => {
      try {
        processScopes(
          {
            'eip155:1': validScopeObject,
          },
          {
            'eip155:5': validScopeObject,
          },
          {
            findNetworkClientIdByChainId,
            getInternalAccounts,
          },
        );
      } catch (err) {
        // noop
      }
      expect(MockValidation.validateScopes).toHaveBeenCalledWith(
        {
          'eip155:1': validScopeObject,
        },
        {
          'eip155:5': validScopeObject,
        },
      );
    });

    it('flatten and merges the validated scopes', () => {
      MockValidation.validateScopes.mockReturnValue({
        validRequiredScopes: {
          'eip155:1': validScopeObject,
        },
        validOptionalScopes: {
          'eip155:5': validScopeObject,
        },
      });

      processScopes(
        {},
        {},
        {
          findNetworkClientIdByChainId,
          getInternalAccounts,
        },
      );
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:1': validScopeObject,
      });
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:5': validScopeObject,
      });
    });

    it('checks if the flattend and merged scopes are supported', () => {
      MockValidation.validateScopes.mockReturnValue({
        validRequiredScopes: {
          'eip155:1': validScopeObject,
        },
        validOptionalScopes: {
          'eip155:5': validScopeObject,
        },
      });
      MockTransform.flattenMergeScopes.mockImplementation((value) => ({
        ...value,
        transformed: true,
      }));

      processScopes(
        {},
        {},
        {
          findNetworkClientIdByChainId,
          getInternalAccounts,
        },
      );
      expect(MockAssert.assertScopesSupported).toHaveBeenCalledWith(
        { 'eip155:1': validScopeObject, transformed: true },
        {
          findNetworkClientIdByChainId,
          getInternalAccounts,
        },
      );
      expect(MockAssert.assertScopesSupported).toHaveBeenCalledWith(
        { 'eip155:5': validScopeObject, transformed: true },
        {
          findNetworkClientIdByChainId,
          getInternalAccounts,
        },
      );
    });

    it('throws an error if the flattened and merged scopes are not supported', () => {
      MockValidation.validateScopes.mockReturnValue({
        validRequiredScopes: {
          'eip155:1': validScopeObject,
        },
        validOptionalScopes: {
          'eip155:5': validScopeObject,
        },
      });
      MockAssert.assertScopesSupported.mockImplementation(() => {
        throw new Error('unsupported scopes');
      });

      expect(() => {
        processScopes(
          {},
          {},
          {
            findNetworkClientIdByChainId,
            getInternalAccounts,
          },
        );
      }).toThrow(new Error('unsupported scopes'));
    });

    it('returns the flatten and merged scopes if they are all supported', () => {
      MockValidation.validateScopes.mockReturnValue({
        validRequiredScopes: {
          'eip155:1': validScopeObject,
        },
        validOptionalScopes: {
          'eip155:5': validScopeObject,
        },
      });
      MockTransform.flattenMergeScopes.mockImplementation((value) => ({
        ...value,
        transformed: true,
      }));

      expect(
        processScopes(
          {},
          {},
          {
            findNetworkClientIdByChainId,
            getInternalAccounts,
          },
        ),
      ).toStrictEqual({
        flattenedRequiredScopes: {
          'eip155:1': validScopeObject,
          transformed: true,
        },
        flattenedOptionalScopes: {
          'eip155:5': validScopeObject,
          transformed: true,
        },
      });
    });
  });
});
