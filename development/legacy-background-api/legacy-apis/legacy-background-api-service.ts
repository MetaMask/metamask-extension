import ts from 'typescript';
import { ResolutionContext } from './module-resolution';

/**
 * A class member that exposes something callable under a name: a method, a
 * getter, or a property whose value is a function.
 */
type CallableMember =
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.PropertyDeclaration;

/**
 * Extracts the names of the public methods of `LegacyBackgroundApiService`.
 *
 * @param sourceFile - The parsed file that defines
 * `LegacyBackgroundApiService`.
 * @param _context - The resolution context.
 * @returns The names of the public methods.
 */
export function getPublicMethodNamesOfLegacyBackgroundApiService(
  sourceFile: ts.SourceFile,
  _context: ResolutionContext,
): Set<string> {
  // EXAMPLE:
  //   class LegacyBackgroundApiService { ... }
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
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
  //   export class LegacyBackgroundApiService {
  //     readonly #messenger: LegacyBackgroundApiServiceMessenger;
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //     async addToken(options) { ... }
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //     #getGlobalProvider() { ... }
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   }
  for (const member of service.members) {
    // EXAMPLES:
    //   isAssetsUnifyStateEnabled() { ... }
    //   get mode() { ... }
    //   addToken = async (options) => { ... }
    //
    // ANTI-EXAMPLES:
    //   readonly messenger: LegacyBackgroundApiServiceMessenger;
    //   #getGlobalProvider() { ... }
    //   private helper() { ... }
    //   protected helper() { ... }
    if (!isPublicCallableMember(member)) {
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
 * Determines whether a class member is callable through the public API.
 *
 * A member counts when it is a method, a getter, or a property initialized to a
 * function (e.g. an arrow function), and it is not hidden behind a `#`, a
 * `private`, or a `protected`.
 *
 * @param member - The class member to inspect.
 * @returns True when the member is part of the public API.
 */
function isPublicCallableMember(
  member: ts.ClassElement,
): member is CallableMember {
  // EXAMPLES:
  //   addToken(options) { ... }
  //   get mode() { ... }
  const isMethodOrGetter =
    ts.isMethodDeclaration(member) || ts.isGetAccessorDeclaration(member);

  // EXAMPLE:
  // addToken = async (options) => { ... }
  //            ^^^^^^^^^^^^^^^^^^^^^^^^^^^ (an arrow function or function
  //                                        expression, as opposed to a plain
  //                                        data field)
  const isFunctionProperty =
    ts.isPropertyDeclaration(member) &&
    member.initializer !== undefined &&
    (ts.isArrowFunction(member.initializer) ||
      ts.isFunctionExpression(member.initializer));

  if (!isMethodOrGetter && !isFunctionProperty) {
    return false;
  }

  // ANTI-EXAMPLES:
  //   #getGlobalProvider() { ... }
  //   private helper() { ... }
  //   protected helper() { ... }
  if (ts.isPrivateIdentifier(member.name)) {
    return false;
  }
  return !member.modifiers?.some(
    (modifier) =>
      modifier.kind === ts.SyntaxKind.PrivateKeyword ||
      modifier.kind === ts.SyntaxKind.ProtectedKeyword,
  );
}
