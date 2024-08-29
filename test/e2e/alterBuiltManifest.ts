import fs from 'fs';

const folder = `dist/${process.env.SELENIUM_BROWSER}`;

if (typeof beforeEach === 'function') {
  beforeEach(() => {
    restoreBackupManifest();

    fs.cpSync(`${folder}/manifest.json`, `${folder}/manifest.backup.json`, {
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
  if (fs.existsSync(`${folder}/manifest.backup.json`)) {
    fs.cpSync(`${folder}/manifest.backup.json`, `${folder}/manifest.json`, {
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
    fs.readFileSync(`${folder}/manifest.json`).toString(),
  );

  manifest._flags = flags;

  fs.writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest));
}
