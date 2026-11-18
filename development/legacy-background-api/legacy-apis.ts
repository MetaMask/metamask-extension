import ts from 'typescript';
import { getPublicMethodNamesOfLegacyBackgroundApiService } from './legacy-apis/legacy-background-api-service';
import {
  getOrLoadSourceFile,
  ResolutionContext,
} from './legacy-apis/module-resolution';

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
   * Extracts the names of the API's members from the parsed file.
   */
  getMemberNames: (
    sourceFile: ts.SourceFile,
    context: ResolutionContext,
  ) => Set<string>;
};

/**
 * The APIs tracked by the legacy background API snapshot, keyed by name.
 */
export const LEGACY_APIS = {
  'MetamaskController.getApi': {
    name: 'MetamaskController.getApi',
    filePath: 'app/scripts/metamask-controller.js',
    getMemberNames: getPropertyNamesOfGetApi,
  },
  LegacyBackgroundApiService: {
    name: 'LegacyBackgroundApiService',
    filePath: 'app/scripts/services/legacy-background-api-service.ts',
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
  const context = {
    sourceFilesByPath: new Map<string, ts.SourceFile>(),
  } satisfies ResolutionContext;
  const sourceFile = getOrLoadSourceFile(context, legacyApi.filePath);

  return legacyApi.getMemberNames(sourceFile, context);
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
  const returnStatements = method.body.statements.filter(ts.isReturnStatement);
  if (returnStatements.length > 1) {
    throw new Error(
      'MetamaskController.getApi has more than one return statement',
    );
  }

  const returnStatement = returnStatements[0];
  if (
    !returnStatement?.expression ||
    !ts.isObjectLiteralExpression(returnStatement.expression)
  ) {
    throw new Error(
      'MetamaskController.getApi does not return an object literal',
    );
  }

  const returnedObject = returnStatement.expression;

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
  for (const property of returnedObject.properties) {
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
