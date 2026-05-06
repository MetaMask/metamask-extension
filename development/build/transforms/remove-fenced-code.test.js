/**
 * @jest-environment node
 */
const { createRemoveFencedCodeTransform } = require('./remove-fenced-code');
const transformUtils = require('./utils');

jest.mock('./utils', () => ({
  getESLintInstance: jest.fn(),
}));

const FEATURE_A = 'build-xx1';
const FEATURE_B = 'build-xx2';

const getMinimalFencedCode = (params = FEATURE_B) =>
  `///: BEGIN:ONLY_INCLUDE_IF(${params})
Conditionally_Included
///: END:ONLY_INCLUDE_IF
`;

const getFeatures = ({ all, active }) => ({
  all: new Set(all),
  active: new Set(active),
});

describe('build/transforms/remove-fenced-code', () => {
  describe('createRemoveFencedCodeTransform', () => {
    const { getESLintInstance: getESLintInstanceMock } = transformUtils;
    const lintTextMock = jest.fn();
    const mockJsFileName = 'file.js';

    beforeEach(() => {
      lintTextMock.mockResolvedValue([{ errorCount: 0, messages: [] }]);
      getESLintInstanceMock.mockImplementation(() => ({
        lintText: lintTextMock,
      }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('returns a PassThrough stream for files with ignored extensions', async () => {
      const fileContent = '"Valid JSON content"\n';
      const stream = createRemoveFencedCodeTransform(
        getFeatures({
          active: [FEATURE_A],
          all: [FEATURE_A],
        }),
      )('file.json');
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(fileContent);
          expect(getESLintInstanceMock).not.toHaveBeenCalled();
          expect(lintTextMock).not.toHaveBeenCalled();
          resolve();
        });

        stream.write(Buffer.from(fileContent));
        setTimeout(() => stream.end());
      });
    });

    it('transforms a file read as a single chunk', async () => {
      const filePrefix = '// A comment\n';
      const fileContent = filePrefix.concat(getMinimalFencedCode());

      const stream = createRemoveFencedCodeTransform(
        getFeatures({
          active: [FEATURE_A],
          all: [FEATURE_A, FEATURE_B],
        }),
      )(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(filePrefix);
          expect(getESLintInstanceMock).toHaveBeenCalledTimes(1);
          expect(lintTextMock).toHaveBeenCalledTimes(1);
          expect(lintTextMock).toHaveBeenCalledWith(
            filePrefix,
            { filePath: mockJsFileName, warnIgnored: false },
          );
          resolve();
        });

        stream.end(fileContent);
      });
    });

    it('transforms a file read as multiple chunks', async () => {
      const filePrefix = '// A comment\n';
      const chunks = filePrefix
        .concat(getMinimalFencedCode())
        .split('\n')
        // The final element in the split array is the empty string, which is
        // useful for calling .join, but undesirable here.
        .filter((line) => line !== '')
        .map((line) => `${line}\n`);

      const stream = createRemoveFencedCodeTransform(
        getFeatures({
          active: [FEATURE_A],
          all: [FEATURE_A, FEATURE_B],
        }),
      )(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(filePrefix);
          expect(getESLintInstanceMock).toHaveBeenCalledTimes(1);
          expect(lintTextMock).toHaveBeenCalledTimes(1);
          expect(lintTextMock).toHaveBeenCalledWith(
            filePrefix,
            { filePath: mockJsFileName, warnIgnored: false },
          );
          resolve();
        });

        chunks.forEach((chunk) => stream.write(chunk));
        setTimeout(() => stream.end());
      });
    });

    it('handles file with fences that is unmodified by the transform', async () => {
      const fileContent = getMinimalFencedCode(FEATURE_A);

      const stream = createRemoveFencedCodeTransform(
        getFeatures({
          active: [FEATURE_A],
          all: [FEATURE_A],
        }),
      )(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(fileContent);
          expect(getESLintInstanceMock).not.toHaveBeenCalled();
          expect(lintTextMock).not.toHaveBeenCalled();
          resolve();
        });

        stream.end(fileContent);
      });
    });

    it('skips linting for transformed file if shouldLintTransformedFiles is false', async () => {
      const filePrefix = '// A comment\n';
      const fileContent = filePrefix.concat(getMinimalFencedCode());

      const stream = createRemoveFencedCodeTransform(
        getFeatures({ all: [FEATURE_A, FEATURE_B], active: [FEATURE_A] }),
        false,
      )(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(filePrefix);
          expect(getESLintInstanceMock).not.toHaveBeenCalled();
          expect(lintTextMock).not.toHaveBeenCalled();
          resolve();
        });

        stream.end(fileContent);
      });
    });

    it('handles error during code fence removal or parsing', async () => {
      const fileContent = getMinimalFencedCode().concat(
        '///: END:ONLY_INCLUDE_IF',
      );

      const stream = createRemoveFencedCodeTransform(
        getFeatures({ all: [FEATURE_A, FEATURE_B], active: [FEATURE_A] }),
      )(mockJsFileName);

      await new Promise((resolve) => {
        stream.on('error', (error) => {
          expect(error.message).toStrictEqual(
            expect.stringContaining(
              'A valid fence consists of two fence lines, but the file contains an uneven number, "3", of fence lines.',
            ),
          );
          expect(getESLintInstanceMock).not.toHaveBeenCalled();
          expect(lintTextMock).not.toHaveBeenCalled();
          resolve();
        });

        stream.end(fileContent);
      });
    });

    it('handles transformed file lint failure', async () => {
      lintTextMock.mockResolvedValueOnce([
        {
          errorCount: 1,
          messages: [
            { severity: 2, message: 'lint failure', ruleId: 'test/rule' },
          ],
        },
      ]);

      const filePrefix = '// A comment\n';
      const fileContent = filePrefix.concat(getMinimalFencedCode());

      const stream = createRemoveFencedCodeTransform(
        getFeatures({ all: [FEATURE_B], active: [] }),
      )(mockJsFileName);

      await new Promise((resolve) => {
        stream.on('error', (error) => {
          expect(error.message).toStrictEqual(
            expect.stringContaining('lint failure'),
          );
          expect(getESLintInstanceMock).toHaveBeenCalledTimes(1);
          expect(lintTextMock).toHaveBeenCalledTimes(1);
          expect(lintTextMock).toHaveBeenCalledWith(
            filePrefix,
            { filePath: mockJsFileName, warnIgnored: false },
          );
          resolve();
        });

        stream.end(fileContent);
      });
    });
  });
});
