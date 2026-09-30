import fs from 'fs';
import { hasProperty, isObject } from '@metamask/utils';
import ts from 'typescript';

/**
 * The path of the snapshot of names that legacy background APIs are allowed to
 * have, relative to the root of the repository.
 */
const SNAPSHOT_PATH = 'legacy-background-api-snapshot.json';

/**
 * Checks that the members of an API (where a member is, say, a method of a
 * class or a property of an object) match the list of names recorded for that
 * API in `legacy-background-api-snapshot.json`.
 *
 * The legacy background APIs are frozen: new members should not be added to
 * them. However, in an emergency, a team may need to add one anyway. Rather
 * than comparing the API against a previous commit, we compare it against a
 * snapshot, which is codeowned by the Core Platform team, so that widening an
 * API requires their approval. Removing a member requires updating the
 * snapshot too, so that it only ever shrinks.
 *
 * Both the file and the snapshot are read relative to the current working
 * directory, which is expected to be the root of the repository.
 *
 * @param options - The options.
 * @param options.filePath - The repository-relative path of the file
 * containing the API.
 * @param options.snapshotKey - The name of the API, which is also the key of
 * its entry in the snapshot.
 * @param options.getMemberNames - Function that extracts the names of the API's
 * members from the parsed file.
 * @returns True if the API has exactly the names listed in the snapshot, false
 * otherwise.
 */
export function checkApiMatchesSnapshot({
  filePath,
  snapshotKey,
  getMemberNames,
}: {
  filePath: string;
  snapshotKey: string;
  getMemberNames: (sourceFile: ts.SourceFile) => Set<string>;
}): boolean {
  const currentNames = getMemberNames(parseFile(filePath));
  const snapshotNames = new Set(readSnapshotEntry(snapshotKey));

  const unlistedNames = [...currentNames]
    .filter((name) => !snapshotNames.has(name))
    .sort();
  const obsoleteNames = [...snapshotNames]
    .filter((name) => !currentNames.has(name))
    .sort();

  if (unlistedNames.length > 0) {
    console.log(
      `${snapshotKey} has names which are not listed in ${SNAPSHOT_PATH}:\n${formatList(unlistedNames)}`,
    );
  }

  if (obsoleteNames.length > 0) {
    console.log(
      `${SNAPSHOT_PATH} lists names which no longer exist in ${snapshotKey}. Please remove them from the snapshot:\n${formatList(obsoleteNames)}`,
    );
  }

  return unlistedNames.length === 0 && obsoleteNames.length === 0;
}

/**
 * Reads and parses the given file using TypeScript, so that API members can be
 * read by analyzing the source code.
 *
 * This only parses the file (no type-checking), so compiler options from
 * `tsconfig.json` do not apply. TypeScript uses the extension of the file to
 * determine whether it is TypeScript or JavaScript.
 *
 * @param filePath - The path of the file to parse.
 * @returns The parsed source file.
 */
function parseFile(filePath: string): ts.SourceFile {
  const source = fs.readFileSync(filePath, 'utf8');
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest);
}

/**
 * Reads the list of names that the snapshot records for the given API.
 *
 * @param snapshotKey - The key of the API's entry in the snapshot.
 * @returns The names that the API is allowed to have.
 */
function readSnapshotEntry(snapshotKey: string): string[] {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    throw new Error(`${SNAPSHOT_PATH} does not exist`);
  }

  let snapshot: unknown;
  try {
    snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`${SNAPSHOT_PATH} is not valid JSON`, { cause: error });
  }

  if (!isObject(snapshot) || !hasProperty(snapshot, snapshotKey)) {
    throw new Error(buildMalformedEntryMessage(snapshotKey));
  }

  const entry = snapshot[snapshotKey];
  if (!isArrayOfStrings(entry)) {
    throw new Error(buildMalformedEntryMessage(snapshotKey));
  }

  return entry;
}

/**
 * Builds the error message used when the snapshot entry for an API is missing
 * or has the wrong shape.
 *
 * @param snapshotKey - The key of the API's entry in the snapshot.
 * @returns The error message.
 */
function buildMalformedEntryMessage(snapshotKey: string): string {
  return `${SNAPSHOT_PATH} must have a "${snapshotKey}" property that is an array of strings`;
}

/**
 * Determines whether the given value is an array of strings.
 *
 * @param value - The value to check.
 * @returns True if the value is an array of strings, false otherwise.
 */
function isArrayOfStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

/**
 * Formats the given names as a bulleted list.
 *
 * @param names - The names to format.
 * @returns The names, one per line, each preceded by a dash.
 */
function formatList(names: string[]): string {
  return names.map((name) => `- ${name}`).join('\n');
}
