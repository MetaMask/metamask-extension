const fs = require('fs');

module.exports.PREINSTALLED_SNAPS = Object.freeze([
  // @metamask/bip32-example-snap
  getPreinstalledSnap(
    '@metamask/bip32-example-snap',
    fs.readFileSync(
      require.resolve('@metamask/bip32-example-snap/snap.manifest.json'),
      'utf-8',
    ),
    [
      {
        path: 'images/icon.svg',
        value: fs.readFileSync(
          require.resolve('@metamask/bip32-example-snap/images/icon.svg'),
        ),
      },
      {
        path: 'dist/bundle.js',
        value: fs.readFileSync(
          require.resolve('@metamask/bip32-example-snap/dist/bundle.js'),
        ),
      },
    ],
  ),
]);

function getPreinstalledSnap(npmPackage, manifest, files) {
  return {
    snapId: `npm:${npmPackage}`,
    manifest: JSON.parse(manifest),
    files,
    removable: false,
  };
}
