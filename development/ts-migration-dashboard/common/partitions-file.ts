import { ModulePartition } from './build-module-partitions';
import { INTERMEDIATE_BUILD_DIRECTORY_PATH } from './constants';

// The `brfs` transform for browserify calls `fs.readLineSync` and
// `path.resolve` at build time and inlines file contents into the source code.
// To accomplish this we have to bring in `fs` and `path` using `require` and
// not `import`. This is weird in a TypeScript file, and typescript-eslint
// (rightly) complains about this, but it's actually okay because the above
// `import` lines will actually get turned into `require`s anyway before passing
// through the rest of browserify. However, `brfs` should handle this. There is
// an active bug for this, but there isn't a known workaround yet:
// <https://github.com/browserify/brfs/issues/39>
/* eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
const fs = require('fs');
/* eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
const path = require('path');

export const PARTITIONS_FILE = path.join(
  INTERMEDIATE_BUILD_DIRECTORY_PATH,
  'partitions.json',
);

export function readPartitionsFile() {
  const content = fs.readFileSync(
    // As this function is called within the app code, which is compiled by
    // Browserify and not executed by Node, this needs to be here — it cannot be
    // extracted — for the reasons explained above.
    path.resolve(__dirname, '../build/intermediate/partitions.json'),
    { encoding: 'utf-8' },
  );
  return JSON.parse(content) as ModulePartition[];
}

export function writePartitionsFile(partitions: ModulePartition[]) {
  fs.mkdirSync(path.dirname(PARTITIONS_FILE), { recursive: true });
  return fs.writeFileSync(
    PARTITIONS_FILE,
    JSON.stringify(partitions, null, '  '),
  );
}
