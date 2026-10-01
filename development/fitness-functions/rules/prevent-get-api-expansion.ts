import ts from 'typescript';
import { preventNewApiMembers } from '../common/prevent-new-api-members';

const TARGET_FILE_PATH = 'app/scripts/metamask-controller.js';

/**
 * Prevents adding properties to the object returned by
 * `MetamaskController.getApi`.
 *
 * @param diff - The diff from the current PR to inspect.
 * @param baseRef - The commit the PR is based on.
 * @returns True if the current PR does not add properties to
 * `MetamaskController.getApi`, false otherwise.
 */
export function preventGetApiExpansion(diff: string, baseRef: string): boolean {
  return preventNewApiMembers({
    diff,
    filePath: TARGET_FILE_PATH,
    getMemberNames: getMethodNamesFromGetApi,
    baseRef,
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
