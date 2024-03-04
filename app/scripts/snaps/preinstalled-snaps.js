// eslint-disable-next-line import/unambiguous
const fs = require('fs');

const PREINSTALLED_SNAPS = [];

///: BEGIN:ONLY_INCLUDE_IF(snaps)
function tryAddSnap(snapName) {
  try {
    PREINSTALLED_SNAPS.push(
      getPreinstalledSnap(
        snapName,
        fs.readFileSync(
          require.resolve(`${snapName}/snap.manifest.json`),
          'utf-8',
        ),
        [
          {
            path: 'images/icon.svg',
            value: fs.readFileSync(
              require.resolve(`${snapName}/images/icon.svg`),
            ),
          },
          {
            path: 'dist/bundle.js',
            value: fs.readFileSync(
              require.resolve(`${snapName}/dist/bundle.js`),
            ),
          },
        ],
      ),
    );
  } catch {
    // Failed adding snap
  }
}

function getPreinstalledSnap(npmPackage, manifest, files) {
  return {
    snapId: `npm:${npmPackage}`,
    manifest: JSON.parse(manifest),
    files,
    removable: false,
  };
}

tryAddSnap('@metamask/message-signing-snap');
///: END:ONLY_INCLUDE_IF

module.exports.PREINSTALLED_SNAPS = Object.freeze(PREINSTALLED_SNAPS);
