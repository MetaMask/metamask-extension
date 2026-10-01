import ts from 'typescript';
import { preventNewApiMembers } from '../common/prevent-new-api-members';

const TARGET_FILE_PATH =
  'app/scripts/services/legacy-background-api-service.ts';

/**
 * Prevents adding public methods to LegacyBackgroundApiService.
 *
 * @param diff - The diff from the current PR to inspect.
 * @param baseRef - The commit the PR is based on.
 * @returns True if the current PR does not add public methods to
 * LegacyBackgroundApiService, false otherwise.
 */
export function preventLegacyBackgroundApiServiceExpansion(
  diff: string,
  baseRef: string,
): boolean {
  return preventNewApiMembers({
    diff,
    filePath: TARGET_FILE_PATH,
    getMemberNames: getMethodNamesFromLegacyBackgroundApiService,
    baseRef,
  });
}

function getMethodNamesFromLegacyBackgroundApiService(
  sourceFile: ts.SourceFile,
): Set<string> {
  const service = sourceFile.statements.find(
    // EXAMPLE:
    // class LegacyBackgroundApiService { ... }
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
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
