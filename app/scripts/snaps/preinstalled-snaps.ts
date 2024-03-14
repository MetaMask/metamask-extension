import type { PreinstalledSnap } from '@metamask/snaps-controllers';

// Preinstalled snaps requires fs and require to read and use any installed snaps.
// We can switch `require` to `import`, but then this file gets transpiled to ESM & won't have access to `require.resolve`.
// Work is needed to create the require object in ESM - specifically the import url. See snippet
// import { createRequire } from 'node:module'
// const require = createRequire(import.meta.url)
//                                ^ The 'import.meta' meta-property is not allowed in files which will build into CommonJS output
/* eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
const fs = require('fs');

const TEMP_PREINSTALLED_SNAPS = [];

///: BEGIN:ONLY_INCLUDE_IF(snaps)
TEMP_PREINSTALLED_SNAPS.push(
  getPreinstalledSnap(
    '@metamask/message-signing-snap',
    fs.readFileSync(
      require.resolve('@metamask/message-signing-snap/snap.manifest.json'),
      'utf-8',
    ),
    [
      {
        path: 'images/icon.svg',
        value: fs.readFileSync(
          require.resolve('@metamask/message-signing-snap/images/icon.svg'),
        ),
      },
      {
        path: 'dist/bundle.js',
        value: fs.readFileSync(
          require.resolve('@metamask/message-signing-snap/dist/bundle.js'),
        ),
      },
    ],
  ),
);

function getPreinstalledSnap(
  npmPackage: string,
  manifest: PreinstalledSnap['manifest'],
  files: PreinstalledSnap['files'],
): PreinstalledSnap {
  return {
    snapId: `npm:${npmPackage}` as PreinstalledSnap['snapId'],
    manifest: JSON.parse(manifest),
    files,
    removable: false,
  };
}
///: END:ONLY_INCLUDE_IF

export const PREINSTALLED_SNAPS = Object.freeze(TEMP_PREINSTALLED_SNAPS);
