import { test as pwTest, expect } from '@playwright/test';
import 'ses';
import '../../../../../app/scripts/lockdown-run';
import '../../../../../app/scripts/lockdown-more';
import {
  getGlobalProperties,
  testIntrinsic,
} from '../../../../helpers/protect-intrinsics-helpers';

pwTest.describe('non-modifiable intrinsics', () => {
  getGlobalProperties().forEach((propertyName) => {
    pwTest(`intrinsic globalThis["${propertyName}"]`, () => {
      expect(() => testIntrinsic(propertyName)).not.toThrow();
    });
  });
});
