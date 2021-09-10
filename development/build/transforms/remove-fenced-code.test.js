const { BuildTypes } = require('../utils');
const {
  createRemoveFencedCodeTransform,
  removeFencedCode,
} = require('./remove-fenced-code');

const testData = getTestData();

const getMinimalInputTemplate = (params = 'flask') => `
///: BEGIN:ONLY_INCLUDE_IN(${params})
Conditionally_Included
///: END:ONLY_INCLUDE_IN
`;

const fenceSentinelRegex = /^\/\/\/:/mu;
const fenceSentinelAndTerminusRegex = /^\/\/\/: \w+/mu;

describe('build/transforms/remove-fenced-code', () => {
  const mockFileName = 'file.js';

  describe('removeFencedCode', () => {
    // Valid inputs
    Object.keys(BuildTypes).forEach((buildType) => {
      it(`transforms file with fences for build type "${buildType}"`, () => {
        expect(
          removeFencedCode(
            mockFileName,
            buildType,
            testData.validInputs.withFences,
          ),
        ).toStrictEqual(testData.validOutputs[buildType]);
      });

      it(`does not modify file without fences for build type "${buildType}"`, () => {
        expect(
          removeFencedCode(
            mockFileName,
            buildType,
            testData.validInputs.withoutFences,
          ),
        ).toStrictEqual(testData.validInputs.withoutFences);
      });
    });

    // Invalid inputs
    it('rejects sentinels preceded by non-whitespace', () => {
      const replacements = ['a ///:', '2 ///:', '_ ///:'];

      replacements.forEach((replacement) => {
        expect(() =>
          removeFencedCode(
            mockFileName,
            BuildTypes.flask,
            getMinimalInputTemplate().replace(fenceSentinelRegex, replacement),
          ),
        ).toThrow(
          /Fence sentinel may only appear at the start of a line, optionally preceded by whitespace.$/u,
        );
      });
    });

    it('rejects sentinels not followed by a single space and a multi-character alphabetical string', () => {
      const replacements = [
        '///:BEGIN',
        '///:XBEGIN',
        '///:_BEGIN',
        '///:B',
        '///:_',
        '///: ',
        '///:',
      ];

      replacements.forEach((replacement) => {
        expect(() =>
          removeFencedCode(
            mockFileName,
            BuildTypes.flask,
            getMinimalInputTemplate().replace(
              fenceSentinelAndTerminusRegex,
              replacement,
            ),
          ),
        ).toThrow(
          /Fence sentinel must be followed by a single space and an alphabetical string of two or more characters.$/u,
        );
      });
    });

    it('rejects malformed directives', () => {
      expect(true).not.toBe(false);
      // const replacements = [
      //   '///:BEGIN',
      //   '///:XBEGIN',
      //   '///:_BEGIN',
      //   '///:B',
      //   '///:_',
      //   '///: ',
      //   '///:',
      // ];

      // replacements.forEach((replacement) => {
      //   expect(() =>
      //     removeFencedCode(
      //       mockFileName,
      //       BuildTypes.flask,
      //       getMinimalInputTemplate().replace(
      //         fenceSentinelAndTerminusRegex,
      //         replacement,
      //       ),
      //     ),
      //   ).toThrow(
      //     /Fence sentinel must be followed by a single space and an alphabetical string of two or more characters.$/u,
      //   );
      // });
    });

    it.todo('rejects files with uneven number of fence lines');
    it.todo('rejects invalid terminuses');
    it.todo('rejects invalid commands');
    it.todo('rejects invalid command parameters');
    it.todo('rejects directive pairs with wrong terminus order');
    it.todo('rejects directive pairs with mismatched commands');
  });

  describe('createRemoveFencedCodeTransform', () => {
    it.todo('transforms a file read as a single buffer');
    it.todo('transforms a file read as multiple buffers');
    // ^with fences split across buffers

    it('rejects invalid build types', () => {
      expect(() => createRemoveFencedCodeTransform('foobar')).toThrow(
        /received unrecognized build type "foobar".$/u,
      );
    });
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
    },

    validOutputs: {
      beta: `
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
    },
  };

  data.validOutputs.flask = data.validInputs.withFences;
  data.validOutputs.main = data.validInputs.withoutFences;
  return data;
}
