// eslint-disable-next-line import/unambiguous
const fs = require('fs');

export const MESSAGE_SIGNING_SNAP = Object.freeze(
  // '@metamask/message-signing-snap',
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

function getPreinstalledSnap(npmPackage, manifest, files) {
  return {
    snapId: `npm:${npmPackage}`,
    manifest: JSON.parse(manifest),
    files,
    removable: false,
  };
}
