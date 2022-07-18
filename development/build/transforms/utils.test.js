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
        `Cannot read properties of undefined (reading '0')`,
      );
      expect(mockESLint).toBeDefined();
    });

    it('returns if linting passes with no errors', async () => {
      mockESLint.lintText.mockImplementationOnce(() =>
        Promise.resolve([{ errorCount: 0 }]),
      );

      expect(
        await lintTransformedFile('/* JavaScript */', 'file.js'),
      ).toBeUndefined();
    });

    it('throws if the file is ignored by ESLint', async () => {
      mockESLint.lintText.mockImplementationOnce(() => Promise.resolve([]));

      await expect(() =>
        lintTransformedFile('/* JavaScript */', 'file.js'),
      ).rejects.toThrow(
        /Transformed file "file\.js" appears to be ignored by ESLint\.$/u,
      );
    });

    it('throws if linting produced any errors', async () => {
      const ruleId = 'some-eslint-rule';
      const message = 'You violated the rule!';

      mockESLint.lintText.mockImplementationOnce(() =>
        Promise.resolve([
          { errorCount: 1, messages: [{ message, ruleId, severity: 2 }] },
        ]),
      );

      await expect(() =>
        lintTransformedFile('/* JavaScript */', 'file.js'),
      ).rejects.toThrow(
        /Lint errors encountered for transformed file "file\.js":\n\n {4}some-eslint-rule\n {4}You violated the rule!\n\n$/u,
      );
    });
  });
});
