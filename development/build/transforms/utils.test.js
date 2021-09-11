const { lintTransformedFile } = require('./utils');

let mockESLint;

jest.mock('eslint', () => ({
  ESLint: class MockESLint {
    constructor() {
      if (mockESLint) {
        throw new Error('Mock ESLint ref already assigned!');
      }

      // eslint-disable-next-line consistent-this
      mockESLint = this;

      // eslint-disable-next-line jest/prefer-spy-on
      this.lintText = jest.fn();
    }
  },
}));

describe('transform utils', () => {
  describe('lintTransformedFile', () => {
    it('initializes the ESLint singleton', async () => {
      expect(mockESLint).not.toBeDefined();

      // This error is an artifact of how we're mocking the ESLint singleton,
      // and won't actually occur in production.
      await expect(() => lintTransformedFile()).rejects.toThrow(
        `Cannot read property '0' of undefined`,
      );
      expect(mockESLint).toBeDefined();
    });

    it.todo('returns if linting passes with no errors');
    it.todo('throws if the file is ignored by ESLint');
    it.todo('throws if linting produced any errors');
  });
});
