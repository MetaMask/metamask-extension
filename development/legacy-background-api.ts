import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { hasProperty, isObject } from '@metamask/utils';
import chalk from 'chalk';
import prettier from 'prettier';
import ts from 'typescript';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Information about a legacy background API: where to find it, how to retrieve
 * it, and what to call it.
 */
type LegacyApi = {
  /**
   * The name of the API, which is also the key of its entry in the snapshot.
   */
  name: 'MetamaskController.getApi' | 'LegacyBackgroundApiService';
  /**
   * The repository-relative path of the file where the API is defined.
   */
  filePath: string;
  /**
   * What the members of the API are called, in the plural (used in messages).
   */
  membersName: string;
  /**
   * Extracts the names of the API's members from the parsed file that holds the
   * API.
   */
  getMemberNames: (sourceFile: ts.SourceFile) => Set<string>;
};

/**
 * The names that each legacy background API is allowed to have, keyed by the
 * name of the API.
 */
type Snapshot = Record<LegacyApi['name'], string[]>;

/**
 * The result of checking a legacy API.
 */
type Result = {
  /**
   * The legacy API.
   */
  legacyApi: LegacyApi;
  /**
   * Names of members in the current state of the legacy API which are not
   * present in the snapshot.
   */
  namesToRemoveFromLegacyApi: string[];
  /**
   * Names of members in the legacy API's snapshot which are not present in the
   * current state of the API itself.
   */
  namesToRemoveFromSnapshot: string[];
};

/**
 * The path of the snapshot, relative to the root of the repository.
 */
const SNAPSHOT_PATH = 'legacy-background-api-snapshot.json';

/**
 * The legacy background APIs that the snapshot tracks.
 */
const LEGACY_APIS = [
  {
    name: 'MetamaskController.getApi',
    filePath: 'app/scripts/metamask-controller.js',
    membersName: 'properties',
    getMemberNames: getPropertyNamesOfGetApi,
  },
  {
    name: 'LegacyBackgroundApiService',
    filePath: 'app/scripts/services/legacy-background-api-service.ts',
    membersName: 'methods',
    getMemberNames: getPublicMethodNamesOfLegacyBackgroundApiService,
  },
] as const satisfies LegacyApi[];

// Run the script!
main().catch((error) => {
  console.error(chalk.red(error));
  process.exitCode = 1;
});

/**
 * The entrypoint to this script.
 */
async function main(): Promise<void> {
  await yargs(hideBin(process.argv))
    .scriptName('legacy-background-api')
    .usage(
      '$0 <command>',
      'Checks that none of the legacy background APIs (`MetamaskController.getApi` and `LegacyBackgroundApiService`) have changes relative to a snapshot; or updates the snapshot itself.',
    )
    .command({
      command: 'check',
      describe: `Fail if the legacy background APIs do not match ${SNAPSHOT_PATH}.`,
      handler: check,
    })
    .command({
      command: 'update',
      describe: `Update ${SNAPSHOT_PATH} to match the legacy background APIs.`,
      handler: update,
    })
    .example('$0 check', 'Verify that the snapshot is up to date.')
    .example('$0 update', 'Update the snapshot after removing methods.')
    .demandCommand(1, 'Please specify a command.')
    .strict()
    .version(false)
    .help()
    .alias('help', 'h')
    .parseAsync();
}

/**
 * The handler for the `check` command.
 *
 * Verifies that each legacy background API has exactly the names listed for
 * it in the snapshot, reporting any differences.
 */
function check(): void {
  const snapshot = readSnapshot();

  const results = LEGACY_APIS.map((legacyApi) =>
    checkApiMemberNamesMatchSnapshot(legacyApi, snapshot),
  );
  const newApiMemberResults = results.filter(
    (result) => result.namesToRemoveFromLegacyApi.length > 0,
  );
  const outdatedSnapshotResults = results.filter(
    (result) => result.namesToRemoveFromSnapshot.length > 0,
  );

  const allChecksPassed =
    newApiMemberResults.length === 0 && outdatedSnapshotResults.length === 0;

  if (allChecksPassed) {
    console.log(chalk.green('All legacy background API match snapshot.'));
    return;
  }

  if (newApiMemberResults.length > 0) {
    reportNewApiMembersError(newApiMemberResults);
  } else if (outdatedSnapshotResults.length > 0) {
    // Don't show this error if there are new API members because we don't want
    // people to update the snapshot prematurely
    reportOutdatedSnapshotError(outdatedSnapshotResults);
  }

  process.exitCode = 1;
}

/**
 * Verifies that the given legacy background API has exactly the names listed
 * for it in the snapshot, reporting any differences.
 *
 * @param legacyApi - The API to check.
 * @param snapshot - The snapshot.
 * @returns True if the API matches the snapshot, false otherwise.
 */
function checkApiMemberNamesMatchSnapshot(
  legacyApi: LegacyApi,
  snapshot: Snapshot,
): Result {
  const currentNames = readApiMemberNames(legacyApi);
  const snapshottedNames = new Set(
    readSnapshottedApiMemberNames(snapshot, legacyApi.name),
  );
  const namesToRemoveFromLegacyApi = setSubtract(
    currentNames,
    snapshottedNames,
  ).sort();
  const namesToRemoveFromSnapshot = setSubtract(
    snapshottedNames,
    currentNames,
  ).sort();

  return {
    legacyApi,
    namesToRemoveFromLegacyApi,
    namesToRemoveFromSnapshot,
  };
}

/**
 * Prints an error that new methods have been added to some legacy APIs.
 *
 * @param results - The results from checking legacy APIs and finding that some
 * methods have been added.
 */
function reportNewApiMembersError(results: Result[]): void {
  console.error(
    chalk.red(
      'ERROR: New methods have been added to some legacy background APIs:\n',
    ),
  );
  const legacyApiNames = results.map((result) => result.legacyApi.name);

  for (const result of results) {
    console.error(`- ${result.legacyApi.name}`);
    console.error(formatList(result.namesToRemoveFromLegacyApi));
  }
  console.error('');

  if (legacyApiNames.length > 1) {
    console.error(
      `${legacyApiNames.join(' and ')} are deprecated legacy APIs,\nand we do not support extending them further.`,
    );
  } else {
    console.error(
      `${legacyApiNames[0]} is a deprecated legacy API,\nand we do not support extending it further.`,
    );
  }

  console.log(
    `
To call a controller or service action through the UI:

1. Go to the controller and service expose the action through its messenger
2. Back in the extension, assign a messenger to the enclosing route and specify the capabilities
3. Use useMessenger() in a UI file to access the route messenger
4. Call the action through this messenger

For more information, see: https://github.com/MetaMask/core/tree/main/docs/legacy/ui-messengers-announcement.md

If this is an emergency and you need to extend a legacy background API for any reason,
please reach out to the Core Platform team.`,
  );
}

/**
 * Prints an error that some legacy background APIs are not reflected in the
 * snapshot.
 *
 * @param results - The results from checking legacy APIs and finding that the
 * snapshot is out of date.
 */
function reportOutdatedSnapshotError(results: Result[]): void {
  console.error(
    chalk.red(
      'ERROR: Methods have been removed from some legacy background APIs which are not reflected in the snapshot:\n',
    ),
  );

  for (const result of results) {
    console.error(`- ${result.legacyApi.name}`);
    console.error(formatList(result.namesToRemoveFromSnapshot));
  }
  console.error('');

  console.error(
    'Please run `yarn legacy-background-api:update` to remove them from the snapshot.',
  );
}

/**
 * Reads and validates the snapshot of legacy background APIs.
 *
 * @returns The snapshot.
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

  // Type assertion: TypeScript doesn't know the keys are specific strings.
  return Object.fromEntries(
    LEGACY_APIS.map((legacyApi) => [
      legacyApi.name,
      readSnapshottedApiMemberNames(snapshot, legacyApi.name),
    ]),
  ) as Snapshot;
}

/**
 * Looks up the names that the snapshot lists for an API.
 *
 * @param snapshot - The parsed snapshot.
 * @param apiName - The name of the API.
 * @returns The names that the API is allowed to have.
 */
function readSnapshottedApiMemberNames(
  snapshot: Record<PropertyKey, unknown>,
  apiName: string,
): string[] {
  const entry = hasProperty(snapshot, apiName) ? snapshot[apiName] : undefined;
  if (!isArrayOfStrings(entry)) {
    throw new Error(
      `${SNAPSHOT_PATH} must have a "${apiName}" property that is an array of strings`,
    );
  }
  return entry;
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
 * The handler for the `update` command.
 *
 * Replaces the snapshot with the names that the legacy background APIs
 * currently have.
 */
async function update(): Promise<void> {
  const entries = LEGACY_APIS.map(
    (legacyApi) =>
      [legacyApi.name, [...readApiMemberNames(legacyApi)].sort()] as const,
  ).sort(([a], [b]) => a.localeCompare(b));
  const prettierOptions = await prettier.resolveConfig(SNAPSHOT_PATH);
  const contents = await prettier.format(
    JSON.stringify(Object.fromEntries(entries), null, 2),
    {
      ...prettierOptions,
      filepath: SNAPSHOT_PATH,
    },
  );
  writeFileSync(SNAPSHOT_PATH, contents);
  console.log(
    `Updated legacy background API snapshot with current members: ${SNAPSHOT_PATH}.`,
  );
}

/**
 * Reads the names of the members that an API currently has.
 *
 * @param legacyApi - The legacy API.
 * @returns The names of the API's members.
 */
function readApiMemberNames(legacyApi: LegacyApi): Set<string> {
  return legacyApi.getMemberNames(parseFile(legacyApi.filePath));
}

/**
 * Reads and parses the given file using TypeScript, so that API members can be
 * read by analyzing the source code.
 *
 * @param filePath - The repository-relative path of the file to parse.
 * @returns The parsed source file.
 */
function parseFile(filePath: string): ts.SourceFile {
  const source = readFileSync(filePath, 'utf8');
  // This only parses the file (no type-checking), so compiler options from
  // `tsconfig.json` do not apply. TypeScript uses the extension of the file to
  // determine whether it is TypeScript or JavaScript.
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest);
}

/**
 * Extracts the names of the properties of the object that
 * `MetamaskController.getApi` returns.
 *
 * @param sourceFile - The parsed file that defines `MetamaskController`.
 * @returns The names of the properties.
 */
function getPropertyNamesOfGetApi(sourceFile: ts.SourceFile): Set<string> {
  // EXAMPLE:
  // class MetamaskController { ... }
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  const controller = sourceFile.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) &&
      statement.name?.text === 'MetamaskController',
  );
  if (!controller) {
    throw new Error('MetamaskController was not found');
  }

  // EXAMPLE (each member of the class):
  // class MetamaskController extends EventEmitter {
  //   constructor(opts) { ... }
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^
  //   getApi() { ... }
  //   ^^^^^^^^^^^^^^^^
  // }
  const method = controller.members.find(
    (member): member is ts.MethodDeclaration =>
      ts.isMethodDeclaration(member) &&
      member.name.getText(sourceFile) === 'getApi',
  );
  if (!method?.body) {
    throw new Error('MetamaskController.getApi was not found');
  }

  // EXAMPLE:
  // return { setTheme: ..., addToken: ... };
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  const returnStatement = method.body.statements.find(
    (
      statement,
    ): statement is ts.ReturnStatement & {
      expression: ts.ObjectLiteralExpression;
    } =>
      ts.isReturnStatement(statement) &&
      statement.expression !== undefined &&
      ts.isObjectLiteralExpression(statement.expression),
  );
  if (!returnStatement) {
    throw new Error(
      'MetamaskController.getApi does not return an object literal',
    );
  }

  const names = new Set<string>();
  // EXAMPLE (each property of the returned object):
  // return {
  //   setTheme: preferencesController.setTheme.bind(preferencesController),
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   setParticipateInMetaMetrics,
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   ...this.otherApi,
  //   ^^^^^^^^^^^^^^^^
  // };
  for (const property of returnStatement.expression.properties) {
    // EXAMPLE:
    // ...this.otherApi,
    // ^^^^^^^^^^^^^^^^
    // A spread has no name of its own, so its source text is used instead.
    if (ts.isSpreadAssignment(property)) {
      names.add(property.getText(sourceFile));
      continue;
    }
    names.add(property.name.getText(sourceFile));
  }
  return names;
}

/**
 * Extracts the names of the public methods of `LegacyBackgroundApiService`.
 *
 * @param sourceFile - The parsed file that defines
 * `LegacyBackgroundApiService`.
 * @returns The names of the public methods.
 */
function getPublicMethodNamesOfLegacyBackgroundApiService(
  sourceFile: ts.SourceFile,
): Set<string> {
  // EXAMPLE:
  // class LegacyBackgroundApiService { ... }
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  const service = sourceFile.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) &&
      statement.name?.text === 'LegacyBackgroundApiService',
  );
  if (!service) {
    throw new Error('LegacyBackgroundApiService was not found');
  }

  const names = new Set<string>();
  // EXAMPLE (each member of the class):
  // export class LegacyBackgroundApiService {
  //   readonly #messenger: LegacyBackgroundApiServiceMessenger;
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   async addToken(options) { ... }
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   #getGlobalProvider() { ... }
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // }
  for (const member of service.members) {
    // EXAMPLE:
    // isAssetsUnifyStateEnabled() { ... }
    //
    // ANTI-EXAMPLES:
    // readonly messenger: LegacyBackgroundApiServiceMessenger;
    // #getGlobalProvider() { ... }
    // private helper() { ... }
    // protected helper() { ... }
    if (
      !ts.isMethodDeclaration(member) ||
      ts.isPrivateIdentifier(member.name) ||
      member.modifiers?.some(
        (modifier) =>
          modifier.kind === ts.SyntaxKind.PrivateKeyword ||
          modifier.kind === ts.SyntaxKind.ProtectedKeyword,
      )
    ) {
      continue;
    }

    // EXAMPLE:
    // async addToken(options) { ... }
    //       ^^^^^^^^ (member.name)
    names.add(member.name.getText(sourceFile));
  }
  return names;
}

/**
 * Lists the values in one set which are not in another.
 *
 * @param set1 - The set to filter.
 * @param set2 - The set to exclude from `set1`.
 * @returns The values in `set1` which are not in `set2`.
 */
function setSubtract(set1: Set<string>, set2: Set<string>): string[] {
  return [...set1].filter((name) => !set2.has(name)).sort();
}

/**
 * Formats the given names as a bulleted list.
 *
 * @param names - The names to format.
 * @returns The names, one per line, each preceded by a dash.
 */
function formatList(names: string[]): string {
  return names.map((name) => `  - ${name}`).join('\n');
}
