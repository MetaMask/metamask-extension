import ts from 'typescript';
import { checkApiMatchesSnapshot } from '../common/check-api-matches-snapshot';

const TARGET_FILE_PATH =
  'app/scripts/services/legacy-background-api-service.ts';

/**
 * Prevents adding public methods to LegacyBackgroundApiService.
 *
 * The public methods must match the `LegacyBackgroundApiService` entry in
 * `legacy-background-api-snapshot.json`. This does not look at the diff: the
 * service is read from the working tree (including unstaged changes), so that
 * edits to the snapshot alone are checked as well.
 *
 * @returns True if the public methods of LegacyBackgroundApiService match the
 * snapshot, false otherwise.
 */
export function preventLegacyBackgroundApiServiceExpansion(): boolean {
  return checkApiMatchesSnapshot({
    filePath: TARGET_FILE_PATH,
    snapshotKey: 'LegacyBackgroundApiService',
    getMemberNames: getMethodNamesFromLegacyBackgroundApiService,
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
