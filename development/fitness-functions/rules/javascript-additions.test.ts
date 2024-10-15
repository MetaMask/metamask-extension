import {
  generateModifyFilesDiff,
  generateCreateFileDiff,
} from '../common/test-data';
import { preventJavaScriptFileAdditions } from './javascript-additions';

describe('preventJavaScriptFileAdditions()', (): void => {
  it('should pass when receiving an empty diff', (): void => {
    const testDiff = '';

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with a new TS file folder', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('app/test.ts', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when receiving a diff with a new JS file', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('app/test.js', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with a new JSX file', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('app/test.jsx', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });
});
