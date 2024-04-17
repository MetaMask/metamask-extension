import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { ModulePartition } from './build-module-partitions';
import { INTERMEDIATE_BUILD_DIRECTORY_PATH } from './constants';

export const PARTITIONS_FILE = join(
  INTERMEDIATE_BUILD_DIRECTORY_PATH,
  'partitions.json',
);

export function readPartitionsFile() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  return require('../build/intermediate/partitions.json') as ModulePartition[];
}

export function writePartitionsFile(partitions: ModulePartition[]) {
  mkdirSync(dirname(PARTITIONS_FILE), { recursive: true });
  return writeFileSync(PARTITIONS_FILE, JSON.stringify(partitions, null, '  '));
}
