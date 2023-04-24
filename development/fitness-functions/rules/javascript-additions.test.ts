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

  it('should pass when receiving a diff with a new TS file on the shared folder', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('shared/test.ts', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when receiving a diff with a new JS file on the shared folder', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('shared/test.js', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with a new JSX file on the shared folder', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('shared/test.jsx', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });
});
