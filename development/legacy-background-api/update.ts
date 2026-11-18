import { writeFileSync } from 'node:fs';
import type { Writable } from 'node:stream';

import { LEGACY_APIS, readApiMemberNames } from './legacy-apis';
import { SNAPSHOT_PATH } from './constants';

/**
 * Replaces the snapshot with the names currently exposed by both APIs.
 *
 * @param options - The output stream used to report the update.
 * @param options.stdout
 */
export async function update({ stdout }: { stdout: Writable }): Promise<void> {
  const entries = Object.values(LEGACY_APIS)
    .map(
      (legacyApi) =>
        [legacyApi.name, [...readApiMemberNames(legacyApi)].sort()] as const,
    )
    .sort(([a], [b]) => a.localeCompare(b));
  const prettier = await import('prettier');
  const prettierOptions = await prettier.resolveConfig(SNAPSHOT_PATH);
  const contents = await prettier.format(
    JSON.stringify(Object.fromEntries(entries), null, 2),
    {
      ...prettierOptions,
      filepath: SNAPSHOT_PATH,
    },
  );
  writeFileSync(SNAPSHOT_PATH, contents);
  stdout.write(
    `Updated legacy background API snapshot with current members: ${SNAPSHOT_PATH}.\n`,
  );
}
