import { test, expect } from '@playwright/test';
// @ts-expect-error lint fails otherwise
import 'ses';
import '../../../../../app/scripts/lockdown-run';
import '../../../../../app/scripts/lockdown-more';
import {
  getGlobalProperties,
  testIntrinsic,
} from '../../../../helpers/protect-intrinsics-helpers';

test.describe('non-modifiable intrinsics', () => {
  getGlobalProperties().forEach((propertyName) => {
    test(`intrinsic globalThis["${propertyName}"]`, () => {
      expect(() => testIntrinsic(propertyName)).not.toThrow();
    });
  });
});
