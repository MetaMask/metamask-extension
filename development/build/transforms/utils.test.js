const { getESLintInstance } = require('./utils');

let mockESLint;

jest.mock('eslint', () => ({
  ESLint: class MockESLint {
    constructor() {
      if (mockESLint) {
        throw new Error('Mock ESLint ref already assigned');
      }

      // eslint-disable-next-line consistent-this
      mockESLint = this;

      // eslint-disable-next-line jest/prefer-spy-on
      this.lintText = jest.fn();
    }
  },
}));

describe('build/transforms/utils', () => {
  describe('getESLintInstance', () => {
    it('initializes the ESLint singleton', async () => {
      expect(mockESLint).not.toBeDefined();

      let eslintInstance = getESLintInstance();
      expect(mockESLint).toBeDefined();
      expect(eslintInstance).toBe(mockESLint);

      // If this doesn't throw, we have succeeded.
      eslintInstance = getESLintInstance();
      expect(mockESLint).toBeDefined();
      expect(eslintInstance).toBe(mockESLint);
    });
  });
});
