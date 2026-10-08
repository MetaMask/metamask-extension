import { readFileSync } from 'node:fs';
import ts from 'typescript';

/**
 * The name of a tracked legacy background API, which is also the key of its
 * snapshot entry.
 */
export type LegacyApiName =
  | 'MetamaskController.getApi'
  | 'LegacyBackgroundApiService';

/**
 * Information about a legacy background API.
 */
export type LegacyApi = {
  /**
   * The name of the API, which is also the key of its snapshot entry.
   */
  name: LegacyApiName;
  /**
   * The repository-relative path of the file where the API is defined.
   */
  filePath: string;
  /**
   * The plural name of the API's members used in messages.
   */
  membersName: string;
  /**
   * Extracts the names of the API's members from the parsed file.
   */
  getMemberNames: (sourceFile: ts.SourceFile) => Set<string>;
};

/**
 * The APIs tracked by the legacy background API snapshot, keyed by name.
 */
export const LEGACY_APIS = {
  'MetamaskController.getApi': {
    name: 'MetamaskController.getApi',
    filePath: 'app/scripts/metamask-controller.js',
    membersName: 'properties',
    getMemberNames: getPropertyNamesOfGetApi,
  },
  LegacyBackgroundApiService: {
    name: 'LegacyBackgroundApiService',
    filePath: 'app/scripts/services/legacy-background-api-service.ts',
    membersName: 'methods',
    getMemberNames: getPublicMethodNamesOfLegacyBackgroundApiService,
  },
} as const satisfies Record<LegacyApiName, LegacyApi>;

/**
 * Reads the current names of a legacy API's members from the working tree.
 *
 * @param legacyApi - The API to inspect.
 * @returns The names of the members currently exposed by the API.
 */
export function readApiMemberNames(legacyApi: LegacyApi): Set<string> {
  const source = readFileSync(legacyApi.filePath, 'utf8');
  // This only parses the file (no type-checking), so compiler options from
  // `tsconfig.json` do not apply. TypeScript uses the extension of the file to
  // determine whether it is TypeScript or JavaScript.
  const sourceFile = ts.createSourceFile(
    legacyApi.filePath,
    source,
    ts.ScriptTarget.Latest,
  );

  return legacyApi.getMemberNames(sourceFile);
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
