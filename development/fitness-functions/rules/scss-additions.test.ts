import {
  generateModifyFilesDiff,
  generateCreateFileDiff,
} from '../common/test-data';
import { preventScssFileAdditions } from './scss-additions';

describe('preventScssFileAdditions()', (): void => {
  it('should pass when receiving an empty diff', (): void => {
    const testDiff = '';

    const hasRulePassed = preventScssFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when modifying an existing SCSS file', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff(
        'ui/components/app/button/button.scss',
        'color: red',
        undefined,
      ),
      generateCreateFileDiff(
        'ui/components/app/button/button.tsx',
        'export default Button;',
      ),
    ].join('');

    const hasRulePassed = preventScssFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when creating a new TS file', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff(
        'ui/components/app/button/button.scss',
        undefined,
        'color: red',
      ),
      generateCreateFileDiff(
        'ui/components/app/button/button.tsx',
        'export default Button;',
      ),
    ].join('');

    const hasRulePassed = preventScssFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when creating a new SCSS file in the ui directory', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff(
        'ui/components/app/button/button.scss',
        undefined,
        'color: red',
      ),
      generateCreateFileDiff(
        'ui/components/app/button/button.scss',
        '.button { color: red; }',
      ),
    ].join('');

    const hasRulePassed = preventScssFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when creating a new SCSS file in the app directory', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.scss', undefined, 'color: blue'),
      generateCreateFileDiff(
        'app/styles/new-component.scss',
        '.component { display: flex; }',
      ),
    ].join('');

    const hasRulePassed = preventScssFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when creating a new SCSS file in the shared directory', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.scss', undefined, 'color: blue'),
      generateCreateFileDiff(
        'shared/styles/tokens.scss',
        '$color-primary: blue;',
      ),
    ].join('');

    const hasRulePassed = preventScssFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });
});
