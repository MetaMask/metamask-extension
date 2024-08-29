import fs from 'fs';

if (typeof beforeEach === 'function') {
  beforeEach(() => {
    restoreBackupManifest();

    fs.cpSync('dist/chrome/manifest.json', 'dist/chrome/manifest.backup.json', {
      preserveTimestamps: true,
    });
  });
}

if (typeof afterEach === 'function') {
  afterEach(() => {
    restoreBackupManifest();
  });
}

function restoreBackupManifest() {
  if (fs.existsSync('dist/chrome/manifest.backup.json')) {
    fs.cpSync('dist/chrome/manifest.backup.json', 'dist/chrome/manifest.json', {
      preserveTimestamps: true,
    });
  }
}

export function setManifestFlags(flags: { circleci?: object } = {}) {
  if (process.env.CIRCLECI) {
    flags.circleci = {
      enabled: true,
      branch: process.env.CIRCLE_BRANCH,
      buildNum: process.env.CIRCLE_BUILD_NUM,
      job: process.env.CIRCLE_JOB,
      nodeIndex: process.env.CIRCLE_NODE_INDEX,
      prNumber: process.env.CIRCLE_PR_NUMBER,
    };
  }

  const manifest = JSON.parse(
    fs.readFileSync('dist/chrome/manifest.json').toString(),
  );

  manifest._flags = flags;

  fs.writeFileSync('dist/chrome/manifest.json', JSON.stringify(manifest));
}
