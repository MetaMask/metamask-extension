const deepFreeze = require('deep-freeze-strict');
const { BuildType } = require('../../lib/build-type');
const {
  createRemoveFencedCodeTransform,
  removeFencedCode,
} = require('./remove-fenced-code');
const transformUtils = require('./utils');

jest.mock('./utils', () => ({
  lintTransformedFile: jest.fn(),
}));

// The test data is just strings. We get it from a function at the end of this
// file because it takes up a lot of lines and is very distracting.
const testData = getTestData();

const getMinimalFencedCode = (params = 'flask') =>
  `///: BEGIN:ONLY_INCLUDE_IN(${params})
Conditionally_Included
///: END:ONLY_INCLUDE_IN
`;

describe('build/transforms/remove-fenced-code', () => {
  describe('createRemoveFencedCodeTransform', () => {
    const { lintTransformedFile: lintTransformedFileMock } = transformUtils;
    const mockJsFileName = 'file.js';

    beforeEach(() => {
      lintTransformedFileMock.mockImplementation(() => Promise.resolve());
    });

    it('rejects invalid build types', () => {
      expect(() => createRemoveFencedCodeTransform('foobar')).toThrow(
        /received unrecognized build type "foobar".$/u,
      );
    });

    it('returns a PassThrough stream for files with ignored extensions', async () => {
      const fileContent = '"Valid JSON content"\n';
      const stream = createRemoveFencedCodeTransform('main')('file.json');
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(fileContent);
          expect(lintTransformedFileMock).not.toHaveBeenCalled();
          resolve();
        });

        stream.write(Buffer.from(fileContent));
        setTimeout(() => stream.end());
      });
    });

    it('transforms a file read as a single chunk', async () => {
      const filePrefix = '// A comment\n';
      const fileContent = filePrefix.concat(getMinimalFencedCode());

      const stream = createRemoveFencedCodeTransform('main')(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(filePrefix);
          expect(lintTransformedFileMock).toHaveBeenCalledTimes(1);
          expect(lintTransformedFileMock).toHaveBeenCalledWith(
            filePrefix,
            mockJsFileName,
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

      const stream = createRemoveFencedCodeTransform('main')(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(filePrefix);
          expect(lintTransformedFileMock).toHaveBeenCalledTimes(1);
          expect(lintTransformedFileMock).toHaveBeenCalledWith(
            filePrefix,
            mockJsFileName,
          );
          resolve();
        });

        chunks.forEach((chunk) => stream.write(chunk));
        setTimeout(() => stream.end());
      });
    });

    it('handles file with fences that is unmodified by the transform', async () => {
      const fileContent = getMinimalFencedCode('main');

      const stream = createRemoveFencedCodeTransform('main')(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(fileContent);
          expect(lintTransformedFileMock).not.toHaveBeenCalled();
          resolve();
        });

        stream.end(fileContent);
      });
    });

    it('skips linting for transformed file if shouldLintTransformedFiles is false', async () => {
      const filePrefix = '// A comment\n';
      const fileContent = filePrefix.concat(getMinimalFencedCode());

      const stream = createRemoveFencedCodeTransform(
        'main',
        false,
      )(mockJsFileName);
      let streamOutput = '';

      await new Promise((resolve) => {
        stream.on('data', (data) => {
          streamOutput = streamOutput.concat(data.toString('utf8'));
        });

        stream.on('end', () => {
          expect(streamOutput).toStrictEqual(filePrefix);
          expect(lintTransformedFileMock).not.toHaveBeenCalled();
          resolve();
        });

        stream.end(fileContent);
      });
    });

    it('handles error during code fence removal or parsing', async () => {
      const fileContent = getMinimalFencedCode().concat(
        '///: END:ONLY_INCLUDE_IN',
      );

      const stream = createRemoveFencedCodeTransform('main')(mockJsFileName);

      await new Promise((resolve) => {
        stream.on('error', (error) => {
          expect(error.message).toStrictEqual(
            expect.stringContaining(
              'A valid fence consists of two fence lines, but the file contains an uneven number, "3", of fence lines.',
            ),
          );
          expect(lintTransformedFileMock).toHaveBeenCalledTimes(0);
          resolve();
        });

        stream.end(fileContent);
      });
    });

    it('handles transformed file lint failure', async () => {
      lintTransformedFileMock.mockImplementationOnce(() =>
        Promise.reject(new Error('lint failure')),
      );

      const filePrefix = '// A comment\n';
      const fileContent = filePrefix.concat(getMinimalFencedCode());

      const stream = createRemoveFencedCodeTransform('main')(mockJsFileName);

      await new Promise((resolve) => {
        stream.on('error', (error) => {
          expect(error).toStrictEqual(new Error('lint failure'));
          expect(lintTransformedFileMock).toHaveBeenCalledTimes(1);
          expect(lintTransformedFileMock).toHaveBeenCalledWith(
            filePrefix,
            mockJsFileName,
          );
          resolve();
        });

        stream.end(fileContent);
      });
    });
  });

  describe('removeFencedCode', () => {
    const mockFileName = 'file.js';

    // Valid inputs
    Object.keys(BuildType).forEach((buildType) => {
      it(`transforms file with fences for build type "${buildType}"`, () => {
        expect(
          removeFencedCode(
            mockFileName,
            buildType,
            testData.validInputs.withFences,
          ),
        ).toStrictEqual(testData.validOutputs[buildType]);

        expect(
          removeFencedCode(
            mockFileName,
            buildType,
            testData.validInputs.extraContentWithFences,
          ),
        ).toStrictEqual(testData.validOutputsWithExtraContent[buildType]);

        // Ensure that the minimal input template is in fact valid
        const minimalInput = getMinimalFencedCode(buildType);
        expect(
          removeFencedCode(mockFileName, buildType, minimalInput),
        ).toStrictEqual([minimalInput, false]);
      });

      it(`does not modify file without fences for build type "${buildType}"`, () => {
        expect(
          removeFencedCode(
            mockFileName,
            buildType,
            testData.validInputs.withoutFences,
          ),
        ).toStrictEqual([testData.validInputs.withoutFences, false]);

        expect(
          removeFencedCode(
            mockFileName,
            buildType,
            testData.validInputs.extraContentWithoutFences,
          ),
        ).toStrictEqual([
          testData.validInputs.extraContentWithoutFences,
          false,
        ]);
      });
    });

    // This is an edge case for the splicing function
    it('transforms file with two fence lines', () => {
      expect(
        removeFencedCode(
          mockFileName,
          BuildType.flask,
          getMinimalFencedCode('main'),
        ),
      ).toStrictEqual(['', true]);
    });

    it('ignores sentinels preceded by non-whitespace', () => {
      const validBeginDirective = '///: BEGIN:ONLY_INCLUDE_IN(flask)\n';
      const ignoredLines = [
        `a ${validBeginDirective}`,
        `2 ${validBeginDirective}`,
        `@ ${validBeginDirective}`,
      ];

      ignoredLines.forEach((ignoredLine) => {
        // These inputs will be transformed
        expect(
          removeFencedCode(
            mockFileName,
            BuildType.flask,
            getMinimalFencedCode('main').concat(ignoredLine),
          ),
        ).toStrictEqual([ignoredLine, true]);

        const modifiedInputWithoutFences = testData.validInputs.withoutFences.concat(
          ignoredLine,
        );

        // These inputs will not be transformed
        expect(
          removeFencedCode(
            mockFileName,
            BuildType.flask,
            modifiedInputWithoutFences,
          ),
        ).toStrictEqual([modifiedInputWithoutFences, false]);
      });
    });

    // Invalid inputs
    it('rejects empty fences', () => {
      const jsComment = '// A comment\n';

      const emptyFence = getMinimalFencedCode()
        .split('\n')
        .filter((line) => line.startsWith('///:'))
        .map((line) => `${line}\n`)
        .join('');

      const emptyFenceWithPrefix = jsComment.concat(emptyFence);
      const emptyFenceWithSuffix = emptyFence.concat(jsComment);
      const emptyFenceSurrounded = emptyFenceWithPrefix.concat(jsComment);

      const inputs = [
        emptyFence,
        emptyFenceWithPrefix,
        emptyFenceWithSuffix,
        emptyFenceSurrounded,
      ];

      inputs.forEach((input) => {
        expect(() =>
          removeFencedCode(mockFileName, BuildType.flask, input),
        ).toThrow(
          `Empty fence found in file "${mockFileName}":\n${emptyFence}`,
        );
      });
    });

    it('rejects sentinels not followed by a single space and a multi-character alphabetical string', () => {
      // Matches the sentinel and terminus component of the first line
      // beginning with "///: TERMINUS"
      const fenceSentinelAndTerminusRegex = /^\/\/\/: \w+/mu;

      const replacements = [
        '///:BEGIN',
        '///:XBEGIN',
        '///:_BEGIN',
        '///:B',
        '///:_',
        '///: ',
        '///: B',
        '///:',
      ];

      replacements.forEach((replacement) => {
        expect(() =>
          removeFencedCode(
            mockFileName,
            BuildType.flask,
            getMinimalFencedCode().replace(
              fenceSentinelAndTerminusRegex,
              replacement,
            ),
          ),
        ).toThrow(
          /Fence sentinel must be followed by a single space and an alphabetical string of two or more characters.$/u,
        );
      });
    });

    it('rejects malformed BEGIN directives', () => {
      // This is the first line of the minimal input template
      const directiveString = '///: BEGIN:ONLY_INCLUDE_IN(flask)';

      const replacements = [
        // Invalid terminus
        '///: BE_GIN:ONLY_INCLUDE_IN(flask)',
        '///: BE6IN:ONLY_INCLUDE_IN(flask)',
        '///: BEGIN7:ONLY_INCLUDE_IN(flask)',
        '///: BeGIN:ONLY_INCLUDE_IN(flask)',
        '///: BE3:ONLY_INCLUDE_IN(flask)',
        '///: BEG-IN:ONLY_INCLUDE_IN(flask)',
        '///: BEG N:ONLY_INCLUDE_IN(flask)',

        // Invalid commands
        '///: BEGIN:ONLY-INCLUDE_IN(flask)',
        '///: BEGIN:ONLY_INCLUDE:IN(flask)',
        '///: BEGIN:ONL6_INCLUDE_IN(flask)',
        '///: BEGIN:ONLY_IN@LUDE_IN(flask)',
        '///: BEGIN:ONLy_INCLUDE_IN(flask)',
        '///: BEGIN:ONLY INCLUDE_IN(flask)',

        // Invalid parameters
        '///: BEGIN:ONLY_INCLUDE_IN(,flask)',
        '///: BEGIN:ONLY_INCLUDE_IN(flask,)',
        '///: BEGIN:ONLY_INCLUDE_IN(flask,,main)',
        '///: BEGIN:ONLY_INCLUDE_IN(,)',
        '///: BEGIN:ONLY_INCLUDE_IN()',
        '///: BEGIN:ONLY_INCLUDE_IN( )',
        '///: BEGIN:ONLY_INCLUDE_IN(flask]',
        '///: BEGIN:ONLY_INCLUDE_IN[flask)',
        '///: BEGIN:ONLY_INCLUDE_IN(flask.main)',
        '///: BEGIN:ONLY_INCLUDE_IN(flask,@)',
        '///: BEGIN:ONLY_INCLUDE_IN(fla k)',

        // Stuff after the directive
        '///: BEGIN:ONLY_INCLUDE_IN(flask) A',
        '///: BEGIN:ONLY_INCLUDE_IN(flask) 9',
        '///: BEGIN:ONLY_INCLUDE_IN(flask)A',
        '///: BEGIN:ONLY_INCLUDE_IN(flask)9',
        '///: BEGIN:ONLY_INCLUDE_IN(flask)_',
        '///: BEGIN:ONLY_INCLUDE_IN(flask))',
      ];

      replacements.forEach((replacement) => {
        expect(() =>
          removeFencedCode(
            mockFileName,
            BuildType.flask,
            getMinimalFencedCode().replace(directiveString, replacement),
          ),
        ).toThrow(
          new RegExp(
            `${replacement.replace(
              /([()[\]])/gu,
              '\\$1',
            )}":\nFailed to parse fence directive.$`,
            'u',
          ),
        );
      });
    });

    it('rejects malformed END directives', () => {
      // This is the last line of the minimal input template
      const directiveString = '///: END:ONLY_INCLUDE_IN';

      const replacements = [
        // Invalid terminus
        '///: ENx:ONLY_INCLUDE_IN',
        '///: EN3:ONLY_INCLUDE_IN',
        '///: EN_:ONLY_INCLUDE_IN',
        '///: EN :ONLY_INCLUDE_IN',
        '///: EN::ONLY_INCLUDE_IN',

        // Invalid commands
        '///: END:ONLY-INCLUDE_IN',
        '///: END::ONLY_INCLUDE_IN',
        '///: END:ONLY_INCLUDE:IN',
        '///: END:ONL6_INCLUDE_IN',
        '///: END:ONLY_IN@LUDE_IN',
        '///: END:ONLy_INCLUDE_IN',
        '///: END:ONLY INCLUDE_IN',

        // Stuff after the directive
        '///: END:ONLY_INCLUDE_IN A',
        '///: END:ONLY_INCLUDE_IN 9',
        '///: END:ONLY_INCLUDE_IN _',
      ];

      replacements.forEach((replacement) => {
        expect(() =>
          removeFencedCode(
            mockFileName,
            BuildType.flask,
            getMinimalFencedCode().replace(directiveString, replacement),
          ),
        ).toThrow(
          new RegExp(
            `${replacement}":\nFailed to parse fence directive.$`,
            'u',
          ),
        );
      });
    });

    it('rejects files with uneven number of fence lines', () => {
      const additions = [
        '///: BEGIN:ONLY_INCLUDE_IN(flask)',
        '///: END:ONLY_INCLUDE_IN',
      ];
      additions.forEach((addition) => {
        expect(() =>
          removeFencedCode(
            mockFileName,
            BuildType.flask,
            getMinimalFencedCode().concat(addition),
          ),
        ).toThrow(
          /A valid fence consists of two fence lines, but the file contains an uneven number, "3", of fence lines.$/u,
        );
      });
    });

    it('rejects invalid terminuses', () => {
      const testCases = [
        ['BEGIN', ['KAPLAR', 'FLASK', 'FOO']],
        ['END', ['KAPLAR', 'FOO', 'BAR']],
      ];

      testCases.forEach(([validTerminus, replacements]) => {
        replacements.forEach((replacement) => {
          expect(() =>
            removeFencedCode(
              mockFileName,
              BuildType.flask,
              getMinimalFencedCode().replace(validTerminus, replacement),
            ),
          ).toThrow(
            new RegExp(
              `Line contains invalid directive terminus "${replacement}".$`,
              'u',
            ),
          );
        });
      });
    });

    it('rejects invalid commands', () => {
      const testCases = [
        [/ONLY_INCLUDE_IN\(/mu, ['ONLY_KEEP_IN(', 'FLASK(', 'FOO(']],
        [/ONLY_INCLUDE_IN$/mu, ['ONLY_KEEP_IN', 'FLASK', 'FOO']],
      ];

      testCases.forEach(([validCommand, replacements]) => {
        replacements.forEach((replacement) => {
          expect(() =>
            removeFencedCode(
              mockFileName,
              BuildType.flask,
              getMinimalFencedCode().replace(validCommand, replacement),
            ),
          ).toThrow(
            new RegExp(
              `Line contains invalid directive command "${replacement.replace(
                '(',
                '',
              )}".$`,
              'u',
            ),
          );
        });
      });
    });

    it('rejects invalid command parameters', () => {
      const testCases = [
        ['bar', ['bar', 'flask,bar', 'flask,beta,main,bar']],
        ['Foo', ['Foo', 'flask,Foo', 'flask,beta,main,Foo']],
        ['b3ta', ['b3ta', 'flask,b3ta', 'flask,beta,main,b3ta']],
        ['bEta', ['bEta', 'flask,bEta', 'flask,beta,main,bEta']],
      ];

      testCases.forEach(([invalidParam, replacements]) => {
        replacements.forEach((replacement) => {
          expect(() =>
            removeFencedCode(
              mockFileName,
              BuildType.flask,
              getMinimalFencedCode(replacement),
            ),
          ).toThrow(
            new RegExp(`"${invalidParam}" is not a valid build type.$`, 'u'),
          );
        });
      });

      // Should fail for empty params
      expect(() =>
        removeFencedCode(
          mockFileName,
          BuildType.flask,
          getMinimalFencedCode('').replace('()', ''),
        ),
      ).toThrow(/No params specified.$/u);
    });

    it('rejects directive pairs with wrong terminus order', () => {
      // We need more than one directive pair for this test
      const input = getMinimalFencedCode().concat(getMinimalFencedCode('beta'));

      const expectedBeginError =
        'The first directive of a pair must be a "BEGIN" directive.';
      const expectedEndError =
        'The second directive of a pair must be an "END" directive.';
      const testCases = [
        [
          'BEGIN:ONLY_INCLUDE_IN(flask)',
          'END:ONLY_INCLUDE_IN',
          expectedBeginError,
        ],
        [
          /END:ONLY_INCLUDE_IN/mu,
          'BEGIN:ONLY_INCLUDE_IN(main)',
          expectedEndError,
        ],
        [
          'BEGIN:ONLY_INCLUDE_IN(beta)',
          'END:ONLY_INCLUDE_IN',
          expectedBeginError,
        ],
      ];

      testCases.forEach(([target, replacement, expectedError]) => {
        expect(() =>
          removeFencedCode(
            mockFileName,
            BuildType.flask,
            input.replace(target, replacement),
          ),
        ).toThrow(expectedError);
      });
    });

    it('ignores files with inline source maps', () => {
      // This is so that there isn't an unnecessary second execution of
      // removeFencedCode with a transpiled version of the same file
      const input = getTestData().validInputs.extraContentWithFences.concat(
        '\n//# sourceMappingURL=as32e32wcwc2234f2ew32cnin4243f4nv9nsdoivnxzoivnd',
      );
      expect(
        removeFencedCode(mockFileName, BuildType.flask, input),
      ).toStrictEqual([input, false]);
    });

    // We can't do this until there's more than one command
    it.todo('rejects directive pairs with mismatched commands');
  });
});

function getTestData() {
  const data = {
    validInputs: {
      withFences: `
///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
Conditionally_Included
///: END:ONLY_INCLUDE_IN
  Always_Included
Always_Included
   Always_Included
Always_Included
  ///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
  Conditionally_Included

  Conditionally_Included
  Conditionally_Included
  ///: END:ONLY_INCLUDE_IN
Always_Included

Always_Included
   Always_Included
          ///: BEGIN:ONLY_INCLUDE_IN(flask)

  Conditionally_Included
    Conditionally_Included
       ///: END:ONLY_INCLUDE_IN
Always_Included
   Always_Included
Always_Included

///: BEGIN:ONLY_INCLUDE_IN(flask)
  Conditionally_Included
Conditionally_Included

       ///: END:ONLY_INCLUDE_IN
`,

      extraContentWithFences: `
///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
Conditionally_Included
///: END:ONLY_INCLUDE_IN
  Always_Included
Always_Included
   Always_Included
Always_Included
  ///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
  Conditionally_Included

  Conditionally_Included
  Conditionally_Included
  ///: END:ONLY_INCLUDE_IN
Always_Included

Always_Included
   Always_Included
          ///: BEGIN:ONLY_INCLUDE_IN(flask)

  Conditionally_Included
    Conditionally_Included
       ///: END:ONLY_INCLUDE_IN
Always_Included
   Always_Included
Always_Included

///: BEGIN:ONLY_INCLUDE_IN(flask)
  Conditionally_Included
Conditionally_Included

       ///: END:ONLY_INCLUDE_IN
    Always_Included
      Always_Included
Always_Included
`,

      withoutFences: `
  Always_Included
Always_Included
   Always_Included
Always_Included
Always_Included

Always_Included
   Always_Included
Always_Included
   Always_Included
Always_Included

`,

      extraContentWithoutFences: `
  Always_Included
Always_Included
   Always_Included
Always_Included
Always_Included

Always_Included
   Always_Included
Always_Included
   Always_Included
Always_Included

    Always_Included
      Always_Included
Always_Included
`,
    },

    validOutputs: {
      beta: [
        `
///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
Conditionally_Included
///: END:ONLY_INCLUDE_IN
  Always_Included
Always_Included
   Always_Included
Always_Included
  ///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
  Conditionally_Included

  Conditionally_Included
  Conditionally_Included
  ///: END:ONLY_INCLUDE_IN
Always_Included

Always_Included
   Always_Included
Always_Included
   Always_Included
Always_Included

`,
        true,
      ],
    },

    validOutputsWithExtraContent: {
      beta: [
        `
///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
Conditionally_Included
///: END:ONLY_INCLUDE_IN
  Always_Included
Always_Included
   Always_Included
Always_Included
  ///: BEGIN:ONLY_INCLUDE_IN(flask,beta)
  Conditionally_Included

  Conditionally_Included
  Conditionally_Included
  ///: END:ONLY_INCLUDE_IN
Always_Included

Always_Included
   Always_Included
Always_Included
   Always_Included
Always_Included

    Always_Included
      Always_Included
Always_Included
`,
        true,
      ],
    },
  };

  data.validOutputs.flask = [data.validInputs.withFences, false];
  data.validOutputs.main = [data.validInputs.withoutFences, true];

  data.validOutputsWithExtraContent.flask = [
    data.validInputs.extraContentWithFences,
    false,
  ];
  data.validOutputsWithExtraContent.main = [
    data.validInputs.extraContentWithoutFences,
    true,
  ];
  return deepFreeze(data);
}
