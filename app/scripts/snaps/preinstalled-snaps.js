// eslint-disable-next-line import/unambiguous
const fs = require('fs');

const PREINSTALLED_SNAPS = [];

///: BEGIN:ONLY_INCLUDE_IF(snaps)
try {
  PREINSTALLED_SNAPS.push(
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

function getPreinstalledSnap(npmPackage, manifest, files) {
  return {
    snapId: `npm:${npmPackage}`,
    manifest: JSON.parse(manifest),
    files,
    removable: false,
  };
}
///: END:ONLY_INCLUDE_IF

module.exports.PREINSTALLED_SNAPS = Object.freeze(PREINSTALLED_SNAPS);
