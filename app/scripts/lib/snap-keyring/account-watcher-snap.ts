import { SnapId } from '@metamask/snaps-sdk';

export const ACCOUNT_WATCHER_SNAP_ID: SnapId =
  'npm:@metamask/account-watcher' as SnapId;

export const ACCOUNT_WATCHER_NAME: string = 'Account Watcher';

// // This is a selective asset import, which loads different things into the bundle for different build types.
// // Used properly, this should reduce the bundle sizes.
// export function getFoxMeshJson() {
//   // This cannot say `isFlask()` because the swc compiler will not inline that
//   if (process.env.METAMASK_BUILD_TYPE === 'flask') {
//     // eslint-disable-next-line import/no-restricted-paths,@typescript-eslint/no-require-imports
//     return require('../../../app/build-types/flask/images/flask-mascot.json');
//   }

//   // eslint-disable-next-line import/no-restricted-paths,@typescript-eslint/no-require-imports
//   return require('../../../app/build-types/main/fox.json');
// }
// const { SnapId } = require('@metamask/snaps-sdk');

// export function getAccountWatcherSnapId(): SnapId {
//   if (
//     process.env.METAMASK_BUILD_TYPE === 'flask' ||
//     process.env.METAMASK_BUILD_TYPE === 'experimental'
//   ) {
//     const ACCOUNT_WATCHER_SNAP_ID: SnapId =
//       'npm:@metamask/account-watcher' as SnapId;

//     return ACCOUNT_WATCHER_SNAP_ID;
//   }
// }
