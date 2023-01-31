import 'ses';
import '../../app/scripts/lockdown-run';
import '../../app/scripts/lockdown-more';
import {
  getGlobalProperties,
  testIntrinsic,
} from '../helpers/protect-intrinsics-helpers';

describe('non-modifiable intrinsics', function () {
  getGlobalProperties().forEach((propertyName) => {
    it(`intrinsic globalThis["${propertyName}"]`, function () {
      testIntrinsic(propertyName);
    });
  });
});
