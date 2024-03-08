import * as fs from 'fs';
import type { PreinstalledSnap } from '@metamask/snaps-controllers';

const TEMP_PREINSTALLED_SNAPS = [];

///: BEGIN:ONLY_INCLUDE_IF(snaps)
try {
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
} catch {
  // Failed adding snap
}

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
