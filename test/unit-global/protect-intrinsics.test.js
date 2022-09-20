import 'ses/lockdown';
import '../../app/scripts/lockdown-run';
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
