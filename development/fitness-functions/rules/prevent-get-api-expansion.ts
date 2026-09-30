import ts from 'typescript';
import { checkApiMatchesSnapshot } from '../common/check-api-matches-snapshot';

const TARGET_FILE_PATH = 'app/scripts/metamask-controller.js';

/**
 * Prevents adding properties to the object returned by
 * `MetamaskController.getApi`.
 *
 * The properties must match the `MetamaskController.getApi` entry in
 * `legacy-background-api-snapshot.json`. This does not look at the diff: the
 * controller is read from the working tree (including unstaged changes), so
 * that edits to the snapshot alone are checked as well.
 *
 * @returns True if the properties of `MetamaskController.getApi` match the
 * snapshot, false otherwise.
 */
export function preventGetApiExpansion(): boolean {
  return checkApiMatchesSnapshot({
    filePath: TARGET_FILE_PATH,
    snapshotKey: 'MetamaskController.getApi',
    getMemberNames: getMethodNamesFromGetApi,
  });
}

function getMethodNamesFromGetApi(sourceFile: ts.SourceFile): Set<string> {
  for (const statement of sourceFile.statements) {
    // EXAMPLE:
    // class MetamaskController { ... }
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (
      !ts.isClassDeclaration(statement) ||
      statement.name?.text !== 'MetamaskController'
    ) {
      continue;
    }

    // EXAMPLE (each member of the class):
    // class MetamaskController extends EventEmitter {
    //   constructor(opts) { ... }
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^
    //   getApi() { ... }
    //   ^^^^^^^^^^^^^^^^
    // }
    const method = statement.members.find(
      (member): member is ts.MethodDeclaration =>
        ts.isMethodDeclaration(member) &&
        member.name.getText(sourceFile) === 'getApi',
    );
    if (!method || !method.body) {
      throw new Error('MetamaskController.getApi was not found');
    }

    // EXAMPLE:
    // return { setTheme: ..., addToken: ... };
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    const returnStatement = method.body.statements.find(
      (
        bodyStatement,
      ): bodyStatement is ts.ReturnStatement & {
        expression: ts.ObjectLiteralExpression;
      } =>
        ts.isReturnStatement(bodyStatement) &&
        bodyStatement.expression !== undefined &&
        ts.isObjectLiteralExpression(bodyStatement.expression),
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

  throw new Error('MetamaskController was not found');
}
