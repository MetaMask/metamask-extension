const {
  generateModifyFilesDiff,
  generateCreateFileDiff,
} = require('../common/test-data');
const { preventJavaScriptFileAdditions } = require('./javascript-additions');

describe('preventJavaScriptFileAdditions()', () => {
  it('should pass when receiving an empty diff', () => {
    const testDiff = '';

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with a new TS file on the shared folder', () => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', null, 'pong'),
      generateCreateFileDiff('shared/test.ts', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when receiving a diff with a new JS file on the shared folder', () => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', null, 'pong'),
      generateCreateFileDiff('shared/test.js', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with a new JSX file on the shared folder', () => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', null, 'pong'),
      generateCreateFileDiff('shared/test.jsx', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });
});
