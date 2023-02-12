const { generateModifyFilesDiff } = require('../common/test-data');
const { checkMochaSyntax } = require('./sinon-assert-syntax');

describe('checkMochaSyntax()', () => {
  it('should pass when receiving an empty diff', () => {
    const testDiff = '';

    const hasRulePassed = checkMochaSyntax(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when receiving a diff with one of the blocked expressions', () => {
    const infringingExpression = 'assert.equal';
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', null, 'pong'),
      generateModifyFilesDiff(
        'test.js',
        `yada yada ${infringingExpression} yada yada`,
        null,
      ),
    ].join('');

    const hasRulePassed = checkMochaSyntax(testDiff);

    expect(hasRulePassed).toBe(false);
  });
});
