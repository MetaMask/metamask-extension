import { existsSync, readFileSync } from 'node:fs';
import type { Writable } from 'node:stream';
import { hasProperty, isObject } from '@metamask/utils';
import chalk from 'chalk';
import { CommandError } from './command-error';
import { LEGACY_APIS, readApiMemberNames, type LegacyApi } from './legacy-apis';
import { SNAPSHOT_PATH } from './constants';
import { setSubtract } from './set-utils';

/**
 * The names stored for each tracked legacy background API.
 */
type Snapshot = Record<LegacyApi['name'], string[]>;

/**
 * The differences between the working tree and the snapshot for one API.
 */
type Result = {
  /**
   * The API that was checked.
   */
  legacyApi: LegacyApi;
  /**
   * Names present in the API but missing from the snapshot.
   */
  namesToRemoveFromLegacyApi: string[];
  /**
   * Names present in the snapshot but missing from the API.
   */
  namesToRemoveFromSnapshot: string[];
};

/**
 * Checks the current API surface against the snapshot.
 *
 * Writes a summary of any mismatches to the given streams and throws a
 * {@link CommandError} when the APIs no longer match the snapshot. The error
 * signals that the failure has already been explained, so the CLI exits with a
 * non-zero status without printing the help text or a stack trace.
 *
 * @param options - The output streams used to report the result.
 * @param options.stdout
 * @param options.stderr
 */
export function check({
  stdout,
  stderr,
}: {
  stdout: Writable;
  stderr: Writable;
}): void {
  const snapshot = readSnapshot();
  const currentNamesByApiName = readApiMemberNames();
  const results = Object.values(LEGACY_APIS).map((legacyApi) =>
    checkApiMemberNamesMatchSnapshot({
      legacyApi,
      currentNames: currentNamesByApiName[legacyApi.name],
      snapshot,
    }),
  );
  const newApiMemberResults = results.filter(
    (result) => result.namesToRemoveFromLegacyApi.length > 0,
  );
  const outdatedSnapshotResults = results.filter(
    (result) => result.namesToRemoveFromSnapshot.length > 0,
  );

  if (
    newApiMemberResults.length === 0 &&
    outdatedSnapshotResults.length === 0
  ) {
    stdout.write(
      `${chalk.green('No changes detected in legacy background APIs, all good.')}\n`,
    );
    return;
  }

  if (newApiMemberResults.length > 0) {
    reportNewApiMembersError(newApiMemberResults, { stdout, stderr });
  } else {
    reportOutdatedSnapshotError(outdatedSnapshotResults, stderr);
  }

  throw new CommandError();
}

/**
 * Compares one tracked API against the snapshot.
 *
 * @param options - The options.
 * @param options.legacyApi - The API to compare.
 * @param options.currentNames - The names the API currently exposes.
 * @param options.snapshot - The snapshot to compare against.
 * @returns The names that differ.
 */
function checkApiMemberNamesMatchSnapshot({
  legacyApi,
  currentNames,
  snapshot,
}: {
  legacyApi: LegacyApi;
  currentNames: Set<string>;
  snapshot: Snapshot;
}): Result {
  const snapshottedNames = new Set(
    readSnapshottedApiMemberNames(snapshot, legacyApi.name),
  );

  return {
    legacyApi,
    namesToRemoveFromLegacyApi: [
      ...setSubtract(currentNames, snapshottedNames),
    ].sort(),
    namesToRemoveFromSnapshot: [
      ...setSubtract(snapshottedNames, currentNames),
    ].sort(),
  };
}

/**
 * Prints the message shown when new members are added to a frozen API.
 *
 * @param results - The APIs that gained new members.
 * @param streams - Where to write the guidance and errors.
 * @param streams.stdout
 * @param streams.stderr
 */
function reportNewApiMembersError(
  results: Result[],
  { stdout, stderr }: { stdout: Writable; stderr: Writable },
): void {
  stderr.write(
    `${chalk.red('ERROR: New methods have been added to some UI<->background APIs which are deprecated. More details below.')}\n\n`,
  );

  for (const result of results) {
    stderr.write(
      `- ${result.legacyApi.newMethodsExplanation}:\n${formatList(result.namesToRemoveFromLegacyApi, 2)}\n`,
    );
  }

  stderr.write(`
The Core Platform team has requested that these APIs not be extended further,
and has developed a new process for accessing controllers and services through the UI:

1. Go to the controller or service and expose the action through its messenger
2. Back in the extension, assign a messenger to the enclosing route and specify the capabilities
3. Use useMessenger() in a UI file to access the route messenger
4. Call the action through this messenger

For more information, see: https://github.com/MetaMask/core/blob/main/docs/legacy/ui-messengers-announcement.md

If this is an emergency and you need to extend a legacy background API for any reason,
please reach out to the Core Platform team.\n`);
}

/**
 * Prints the message shown when the snapshot has stale entries.
 *
 * @param results - The APIs whose snapshots are stale.
 * @param stderr - Where to write the error message.
 */
function reportOutdatedSnapshotError(
  results: Result[],
  stderr: Writable,
): void {
  stderr.write(
    `${chalk.red('ERROR: Methods have been removed from some legacy background APIs which are not reflected in the snapshot:\n')}\n`,
  );

  for (const result of results) {
    stderr.write(
      `- ${result.legacyApi.name}\n${formatList(result.namesToRemoveFromSnapshot)}\n`,
    );
  }
  stderr.write('\n');
  stderr.write(
    'Please run `yarn legacy-background-api:update` to remove them from the snapshot.\n',
  );
}

/**
 * Reads and validates the snapshot.
 *
 * @returns The parsed snapshot.
 */
function readSnapshot(): Snapshot {
  if (!existsSync(SNAPSHOT_PATH)) {
    throw new Error(
      `${SNAPSHOT_PATH} does not exist. Please run \`yarn legacy-background-api:update\` to create it.`,
    );
  }

  let snapshot: unknown;
  try {
    snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`${SNAPSHOT_PATH} is not valid JSON`, { cause: error });
  }

  if (!isObject(snapshot)) {
    throw new Error(`${SNAPSHOT_PATH} must contain an object`);
  }

  return {
    legacyBackgroundApiServiceMethods: readSnapshottedApiMemberNames(
      snapshot,
      'legacyBackgroundApiServiceMethods',
    ),
    messengerClientApiMethods: readSnapshottedApiMemberNames(
      snapshot,
      'messengerClientApiMethods',
    ),
    getApiMethods: readSnapshottedApiMemberNames(snapshot, 'getApiMethods'),
    adhocControllerConnectionMethods: readSnapshottedApiMemberNames(
      snapshot,
      'adhocControllerConnectionMethods',
    ),
  };
}

/**
 * Reads and validates a single snapshot entry.
 *
 * @param snapshot - The parsed snapshot.
 * @param apiName - The name of the API.
 * @returns The recorded member names.
 */
function readSnapshottedApiMemberNames(
  snapshot: Record<PropertyKey, unknown>,
  apiName: string,
): string[] {
  const entry = hasProperty(snapshot, apiName) ? snapshot[apiName] : undefined;
  if (
    !Array.isArray(entry) ||
    !entry.every((item) => typeof item === 'string')
  ) {
    throw new Error(
      `${SNAPSHOT_PATH} must have a "${apiName}" property that is an array of strings`,
    );
  }
  return entry;
}

/**
 * Formats names as a bulleted list.
 *
 * @param names - The names to format.
 * @param indentSize - The number of spaces before each bullet.
 * @returns The formatted list.
 */
function formatList(names: string[], indentSize = 2): string {
  const indentation = ' '.repeat(indentSize);
  return names.map((name) => `${indentation}- ${name}`).join('\n');
}
