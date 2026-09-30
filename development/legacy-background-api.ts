import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { hasProperty, isObject } from '@metamask/utils';
import chalk from 'chalk';
import prettier from 'prettier';
import ts from 'typescript';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * A legacy background API, which is frozen: its set of members (for instance,
 * the methods of a class or the properties of an object) is recorded in the
 * snapshot, and may not grow.
 */
type LegacyApi = {
  /**
   * The name of the API, which is also the key of its entry in the snapshot.
   */
  name: string;
  /**
   * The repository-relative path of the file that defines the API.
   */
  filePath: string;
  /**
   * What the members of the API are called, in the plural (used in messages).
   */
  memberNoun: string;
  /**
   * Extracts the names of the API's members from the parsed file.
   */
  getMemberNames: (sourceFile: ts.SourceFile) => Set<string>;
};

/**
 * The names that each legacy background API is allowed to have, keyed by the
 * name of the API.
 */
type Snapshot = Record<string, string[]>;

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
    memberNoun: 'properties',
    getMemberNames: getPropertyNamesOfGetApi,
  },
  {
    name: 'LegacyBackgroundApiService',
    filePath: 'app/scripts/services/legacy-background-api-service.ts',
    memberNoun: 'methods',
    getMemberNames: getPublicMethodNamesOfLegacyBackgroundApiService,
  },
] as const satisfies LegacyApi[];

/**
 * Guidance shown when members are added to a legacy background API.
 */
const MIGRATION_GUIDANCE = [
  'Instead, place the actions in a controller or service, expose them through the messenger, and use useMessenger() in UI files to access them.',
  '- You can read more about UI messengers here: https://github.com/MetaMask/core/tree/main/docs/legacy/ui-messengers-announcement.md',
  '- You can read about data services here: https://github.com/MetaMask/core/tree/main/docs/legacy/data-services-announcement.md',
  'If this is an emergency, please reach out to @MetaMask/core-platform.',
].join('\n');

main().catch((error) => {
  console.error(chalk.red(error));
  process.exitCode = 1;
});

/**
 * Checks or updates the snapshot of names that the legacy background APIs
 * (`MetamaskController.getApi` and `LegacyBackgroundApiService`) are allowed
 * to have.
 *
 * These APIs are frozen. `check` runs as part of `yarn lint` and fails if the
 * APIs do not match the snapshot. The snapshot is codeowned by the Core
 * Platform team, so when methods are removed, `update` can be used to shrink
 * it, but widening it (for instance, in an emergency) requires their approval.
 */
async function main(): Promise<void> {
  await yargs(hideBin(process.argv))
    .scriptName('legacy-background-api')
    .usage(
      '$0 <command>\n\nChecks or updates the snapshot of names that the legacy background APIs are allowed to have.',
    )
    .command(
      'check',
      `Fail if the legacy background APIs do not match ${SNAPSHOT_PATH}.`,
      () => undefined,
      () => {
        check();
      },
    )
    .command(
      'update',
      `Update ${SNAPSHOT_PATH} to match the legacy background APIs.`,
      () => undefined,
      async () => {
        await update();
      },
    )
    .example('$0 check', 'Verify that the snapshot is up to date.')
    .example('$0 update', 'Update the snapshot after removing methods.')
    .demandCommand(1, 'Please specify a command.')
    .strict()
    .version(false)
    .help()
    .alias('help', 'h')
    .fail((message, error, instance) => {
      if (error) {
        throw error;
      }
      instance.showHelp();
      console.error(`\n${message}`);
      process.exit(1);
    })
    .parseAsync();
}

/**
 * Verifies that each legacy background API has exactly the names listed for
 * it in the snapshot, reporting any differences.
 */
function check(): void {
  const snapshot = readSnapshot();

  let isInSync = true;
  for (const api of LEGACY_APIS) {
    if (!checkApi(api, snapshot)) {
      isInSync = false;
    }
  }

  if (!isInSync) {
    process.exitCode = 1;
    return;
  }

  console.log(chalk.green.bold('Legacy background API check passed.'));
}

/**
 * Verifies that the given legacy background API has exactly the names listed
 * for it in the snapshot, reporting any differences.
 *
 * @param api - The API to check.
 * @param snapshot - The snapshot.
 * @returns True if the API matches the snapshot, false otherwise.
 */
function checkApi(api: LegacyApi, snapshot: Snapshot): boolean {
  const currentNames = readMemberNames(api);
  const snapshotNames = new Set(getSnapshotEntry(snapshot, api.name));
  const addedNames = subtractNames(currentNames, snapshotNames);
  const removedNames = subtractNames(snapshotNames, currentNames);

  if (addedNames.length > 0) {
    reportAddedNames(api, addedNames);
  }

  if (removedNames.length > 0) {
    reportRemovedNames(api, removedNames);
  }

  return addedNames.length === 0 && removedNames.length === 0;
}

/**
 * Reports names which are present in an API but not in the snapshot.
 *
 * @param api - The API.
 * @param names - The names which are not in the snapshot.
 */
function reportAddedNames(api: LegacyApi, names: string[]): void {
  console.error(
    chalk.red(
      `${api.name} has ${api.memberNoun} which are not listed in ${SNAPSHOT_PATH}:\n${formatList(names)}\n`,
    ),
  );
  console.error(
    `${api.name} is frozen, so please remove these ${api.memberNoun}. ${MIGRATION_GUIDANCE}\n`,
  );
}

/**
 * Reports names which are present in the snapshot but not in an API.
 *
 * @param api - The API.
 * @param names - The names which are no longer in the API.
 */
function reportRemovedNames(api: LegacyApi, names: string[]): void {
  console.error(
    chalk.red(
      `${SNAPSHOT_PATH} lists ${api.memberNoun} which no longer exist in ${api.name}:\n${formatList(names)}\n`,
    ),
  );
  console.error(
    'Please run `yarn legacy-background-api:update` to remove them from the snapshot.\n',
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

/**
 * Lists the names in one set which are not in another.
 *
 * @param names - The names to filter.
 * @param namesToRemove - The names to exclude.
 * @returns The names in `names` but not in `namesToRemove`, sorted.
 */
function subtractNames(
  names: Set<string>,
  namesToRemove: Set<string>,
): string[] {
  return [...names].filter((name) => !namesToRemove.has(name)).sort();
}

/**
 * Reads and validates the snapshot.
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

  return Object.fromEntries(
    LEGACY_APIS.map((api) => [api.name, getSnapshotEntry(snapshot, api.name)]),
  );
}

/**
 * Looks up the names that the snapshot lists for an API.
 *
 * @param snapshot - The parsed snapshot.
 * @param apiName - The name of the API.
 * @returns The names that the API is allowed to have.
 */
function getSnapshotEntry(
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
 * Replaces the snapshot with the names that the legacy background APIs
 * currently have.
 */
async function update(): Promise<void> {
  const entries = LEGACY_APIS.map(
    (api) => [api.name, [...readMemberNames(api)].sort()] as const,
  ).sort(([a], [b]) => a.localeCompare(b));
  const prettierOptions = await prettier.resolveConfig(SNAPSHOT_PATH);
  const contents = await prettier.format(
    JSON.stringify(Object.fromEntries(entries), null, 2),
    { ...prettierOptions, filepath: SNAPSHOT_PATH },
  );
  writeFileSync(SNAPSHOT_PATH, contents);
  console.log(`Wrote legacy background API names to ${SNAPSHOT_PATH}.`);
}

/**
 * Reads the names of the members that an API currently has.
 *
 * @param api - The API.
 * @returns The names of the API's members.
 */
function readMemberNames(api: LegacyApi): Set<string> {
  return api.getMemberNames(parseFile(api.filePath));
}

/**
 * Reads and parses the given file using TypeScript, so that API members can be
 * read by analyzing the source code.
 *
 * This only parses the file (no type-checking), so compiler options from
 * `tsconfig.json` do not apply. TypeScript uses the extension of the file to
 * determine whether it is TypeScript or JavaScript.
 *
 * @param filePath - The repository-relative path of the file to parse.
 * @returns The parsed source file.
 */
function parseFile(filePath: string): ts.SourceFile {
  const source = readFileSync(filePath, 'utf8');
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
