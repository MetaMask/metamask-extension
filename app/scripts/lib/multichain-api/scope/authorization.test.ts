import * as Validation from './validation';
import * as Transform from './transform';
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

const validScopeObject: ScopeObject = {
  methods: [],
  notifications: [],
};

describe('Scope Authorization', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processScopes', () => {
    it('validates the scopes', () => {
      try {
        processScopes(
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

      processScopes({}, {});
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:1': validScopeObject,
      });
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:5': validScopeObject,
      });
    });

    it('returns the flatten and merged scopes', () => {
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

      expect(processScopes({}, {})).toStrictEqual({
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
