import * as Validation from './validation';
import * as Transform from './transform';
import * as Filter from './filter';
import {
  bucketScopes,
  processScopedProperties,
  validateAndFlattenScopes,
} from './authorization';
import { ScopeObject } from './scope';

jest.mock('./validation', () => ({
  validateScopedPropertyEip3085: jest.fn(),
  validateScopes: jest.fn(),
}));
const MockValidation = jest.mocked(Validation);

jest.mock('./transform', () => ({
  flattenMergeScopes: jest.fn(),
}));
const MockTransform = jest.mocked(Transform);

jest.mock('./filter', () => ({
  bucketScopesBySupport: jest.fn(),
}));
const MockFilter = jest.mocked(Filter);

const validScopeObject: ScopeObject = {
  methods: [],
  notifications: [],
};

describe('Scope Authorization', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateAndFlattenScopes', () => {
    it('validates the scopes', () => {
      try {
        validateAndFlattenScopes(
          {
            'eip155:1': validScopeObject,
          },
          {
            'eip155:5': validScopeObject,
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

      validateAndFlattenScopes({}, {});
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:1': validScopeObject,
      });
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:5': validScopeObject,
      });
    });

    it('returns the flattened and merged scopes', () => {
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

      expect(validateAndFlattenScopes({}, {})).toStrictEqual({
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

  describe('bucketScopes', () => {
    beforeEach(() => {
      let callCount = 0;
      MockFilter.bucketScopesBySupport.mockImplementation(() => {
        callCount += 1;
        return {
          supportedScopes: {
            'mock:A': {
              methods: [`mock_method_${callCount}`],
              notifications: [],
            },
          },
          unsupportableScopes: {
            'mock:B': {
              methods: [`mock_method_${callCount}`],
              notifications: [],
            },
          },
        };
      });
    });

    it('buckets the scopes by supported', () => {
      const isChainIdSupported = jest.fn();
      bucketScopes(
        {
          wallet: {
            methods: [],
            notifications: [],
          },
        },
        {
          isChainIdSupported,
          isChainIdSupportable: jest.fn(),
        },
      );

      expect(MockFilter.bucketScopesBySupport).toHaveBeenCalledWith(
        {
          wallet: {
            methods: [],
            notifications: [],
          },
        },
        {
          isChainIdSupported,
        },
      );
    });

    it('buckets the mayble supportable scopes', () => {
      const isChainIdSupportable = jest.fn();
      bucketScopes(
        {
          wallet: {
            methods: [],
            notifications: [],
          },
        },
        {
          isChainIdSupported: jest.fn(),
          isChainIdSupportable,
        },
      );

      expect(MockFilter.bucketScopesBySupport).toHaveBeenCalledWith(
        {
          'mock:B': {
            methods: [`mock_method_1`],
            notifications: [],
          },
        },
        {
          isChainIdSupported: isChainIdSupportable,
        },
      );
    });

    it('returns the bucketed scopes', () => {
      expect(
        bucketScopes(
          {
            wallet: {
              methods: [],
              notifications: [],
            },
          },
          {
            isChainIdSupported: jest.fn(),
            isChainIdSupportable: jest.fn(),
          },
        ),
      ).toStrictEqual({
        supportedScopes: {
          'mock:A': {
            methods: [`mock_method_1`],
            notifications: [],
          },
        },
        supportableScopes: {
          'mock:A': {
            methods: [`mock_method_2`],
            notifications: [],
          },
        },
        unsupportableScopes: {
          'mock:B': {
            methods: [`mock_method_2`],
            notifications: [],
          },
        },
      });
    });
  });

  describe('processScopedProperties', () => {
    it('excludes scopeStrings that are not defined in either required or optional scopes', () => {
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {
            'eip155:5': validScopeObject,
          },
          {
            'eip155:10': {},
          },
        ),
      ).toStrictEqual({});
    });

    it('includes scopeStrings that are defined in either required or optional scopes', () => {
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {
            'eip155:5': validScopeObject,
          },
          {
            'eip155:1': {},
            'eip155:5': {},
          },
        ),
      ).toStrictEqual({
        'eip155:1': {},
        'eip155:5': {},
      });
    });

    it('validates eip3085 properties', () => {
      processScopedProperties(
        {
          'eip155:1': validScopeObject,
        },
        {},
        {
          'eip155:1': {
            eip3085: {
              foo: 'bar',
            },
          },
        },
      );
      expect(MockValidation.validateScopedPropertyEip3085).toHaveBeenCalledWith(
        'eip155:1',
        {
          foo: 'bar',
        },
      );
    });

    it('excludes invalid eip3085 properties', () => {
      MockValidation.validateScopedPropertyEip3085.mockImplementation(() => {
        throw new Error('invalid eip3085 params');
      });
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {},
          {
            'eip155:1': {
              eip3085: {
                foo: 'bar',
              },
            },
          },
        ),
      ).toStrictEqual({
        'eip155:1': {},
      });
    });

    it('includes valid eip3085 properties', () => {
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {},
          {
            'eip155:1': {
              eip3085: {
                foo: 'bar',
              },
            },
          },
        ),
      ).toStrictEqual({
        'eip155:1': {
          eip3085: {
            foo: 'bar',
          },
        },
      });
    });
  });
});
