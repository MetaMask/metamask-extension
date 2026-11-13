import ts from 'typescript';
import { loadImportedSourceFile, ResolutionContext } from './module-resolution';

/**
 * A declaration that can be referred to by a bare identifier, as opposed to a
 * class member, which can only be reached through property access.
 */
export type LexicalDeclaration =
  | ts.FunctionDeclaration
  | ts.ClassDeclaration
  | ts.VariableDeclaration
  | ts.ParameterDeclaration
  | ts.BindingElement;

/**
 * Finds the declarations that a bare identifier refers to.
 *
 * Lookup follows lexical scoping: it starts in the scope containing the
 * identifier and walks outward, stopping at the first scope that declares the
 * name, so inner declarations shadow outer ones. At the top level of a file,
 * matching relative imports are followed into the imported file.
 *
 * This approximates TypeScript's scoping without a type checker. Notably, `var`
 * declarations are treated as block-scoped rather than function-scoped.
 *
 * @param identifier - The identifier to resolve.
 * @param context - The resolution context.
 * @returns The matching declarations, or an empty array if none are found.
 */
export function resolveDeclarations(
  identifier: ts.Identifier,
  context: ResolutionContext,
): LexicalDeclaration[] {
  const name = identifier.text;
  let scope = findEnclosingScope(identifier);

  while (scope) {
    const declarations = collectDeclarationsInScope(scope, name);
    if (declarations.length > 0) {
      return declarations;
    }

    if (ts.isSourceFile(scope)) {
      return findDefinitionsThroughImports(scope, name, context);
    }
    scope = findEnclosingScope(scope);
  }

  return [];
}

/**
 * Follows the imports of a file that bring a name into scope.
 *
 * @param sourceFile - The file containing the imports.
 * @param name - The local name being resolved.
 * @param context - The resolution context.
 * @returns The declarations of the imported name in the imported files.
 */
function findDefinitionsThroughImports(
  sourceFile: ts.SourceFile,
  name: string,
  context: ResolutionContext,
): LexicalDeclaration[] {
  const declarations: LexicalDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    // EXAMPLE:
    //   import { getTransactionControllerApi } from './transaction-controller';
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (ts.isImportDeclaration(statement)) {
      declarations.push(
        ...findDefinitionsThroughImport(statement, name, context),
      );
    }
  }
  return declarations;
}

/**
 * Finds the definition of a name brought into scope by one import.
 *
 * @param importDeclaration - The import to inspect.
 * @param name - The local name being resolved.
 * @param context - The resolution context.
 * @returns The matching top-level declarations in the imported file.
 */
function findDefinitionsThroughImport(
  importDeclaration: ts.ImportDeclaration,
  name: string,
  context: ResolutionContext,
): LexicalDeclaration[] {
  const importedName = findImportedName(importDeclaration, name);
  if (importedName === undefined) {
    return [];
  }

  const importedSourceFile = loadImportedSourceFile(importDeclaration, context);
  if (!importedSourceFile) {
    return [];
  }
  return findExportedDeclarations(
    importedSourceFile,
    importedName,
    context,
    new Set(),
  );
}

/**
 * Determines which exported name an import binds to a local name.
 *
 * @param importDeclaration - The import to inspect.
 * @param localName - The name used in the importing file.
 * @returns The name exported by the imported file, or undefined if this import
 * does not bind the local name.
 */
function findImportedName(
  importDeclaration: ts.ImportDeclaration,
  localName: string,
): string | undefined {
  const clause = importDeclaration.importClause;
  if (!clause) {
    return undefined;
  }

  // EXAMPLE:
  //   import PerpsStreamBridge from './perps-stream-bridge';
  //          ^^^^^^^^^^^^^^^^^ default import
  if (clause.name?.text === localName) {
    return localName;
  }

  const { namedBindings } = clause;
  if (!namedBindings || !ts.isNamedImports(namedBindings)) {
    return undefined;
  }

  for (const element of namedBindings.elements) {
    // EXAMPLE:
    //   import { getApi as getPerpsApi } from './perps';
    //            ^^^^^^ propertyName (exported name)
    //                      ^^^^^^^^^^^ name (local name)
    if (element.name.text === localName) {
      return element.propertyName?.text ?? element.name.text;
    }
  }
  return undefined;
}

/**
 * Finds the declarations that a file exports under a name.
 *
 * Re-exports are followed, so importing from a barrel file such as `index.ts`
 * leads to the file that actually defines the name.
 *
 * @param sourceFile - The file whose exports to search.
 * @param exportedName - The name the file exports.
 * @param context - The resolution context.
 * @param visitedSourceFiles - Files already searched, to stop circular
 * re-exports.
 * @returns The matching declarations.
 */
function findExportedDeclarations(
  sourceFile: ts.SourceFile,
  exportedName: string,
  context: ResolutionContext,
  visitedSourceFiles: Set<ts.SourceFile>,
): LexicalDeclaration[] {
  if (visitedSourceFiles.has(sourceFile)) {
    return [];
  }
  visitedSourceFiles.add(sourceFile);

  // EXAMPLE:
  //   export const ExecutionServiceInit = (request) => { ... };
  //                ^^^^^^^^^^^^^^^^^^^^ top-level declaration
  const declarations = collectDeclarationsInScope(sourceFile, exportedName);
  if (declarations.length > 0) {
    return declarations;
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement)) {
      continue;
    }
    declarations.push(
      ...findDefinitionsThroughReexport(
        statement,
        exportedName,
        context,
        visitedSourceFiles,
      ),
    );
  }
  return declarations;
}

/**
 * Finds the declarations that one `export ... from` statement re-exports under
 * a name.
 *
 * @param exportDeclaration - The export statement to inspect.
 * @param exportedName - The name being looked up.
 * @param context - The resolution context.
 * @param visitedSourceFiles - Files already searched.
 * @returns The matching declarations.
 */
function findDefinitionsThroughReexport(
  exportDeclaration: ts.ExportDeclaration,
  exportedName: string,
  context: ResolutionContext,
  visitedSourceFiles: Set<ts.SourceFile>,
): LexicalDeclaration[] {
  const { exportClause } = exportDeclaration;
  let sourceName: string | undefined;

  // EXAMPLE:
  //   export * from './execution-service-init';
  //          ^ (no export clause)
  if (!exportClause) {
    sourceName = exportedName;
  }

  // EXAMPLE:
  //   export { ExecutionServiceInit as Init } from './execution-service-init';
  //            ^^^^^^^^^^^^^^^^^^^^ propertyName (name in the source file)
  //                                    ^^^^ name (name exported here)
  if (exportClause && ts.isNamedExports(exportClause)) {
    const element = exportClause.elements.find(
      (candidate) => candidate.name.text === exportedName,
    );
    sourceName = element && (element.propertyName ?? element.name).text;
  }

  if (sourceName === undefined) {
    return [];
  }

  const reexportedSourceFile = loadImportedSourceFile(
    exportDeclaration,
    context,
  );
  if (!reexportedSourceFile) {
    return [];
  }
  return findExportedDeclarations(
    reexportedSourceFile,
    sourceName,
    context,
    visitedSourceFiles,
  );
}

/**
 * Finds the nearest node above the given one that introduces a scope.
 *
 * @param node - The node whose scope is needed.
 * @returns The scope node, or undefined if the node is a source file.
 */
function findEnclosingScope(node: ts.Node): ts.Node | undefined {
  let currentNode = node.parent;
  while (currentNode) {
    if (isScope(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.parent;
  }
  return undefined;
}

/**
 * Collects the declarations of a name that belong directly to a scope.
 *
 * Declarations inside nested scopes are skipped because they are not visible
 * from the given scope.
 *
 * @param scope - The scope node to search.
 * @param name - The name to look for.
 * @returns The matching declarations.
 */
function collectDeclarationsInScope(
  scope: ts.Node,
  name: string,
): LexicalDeclaration[] {
  const declarations: LexicalDeclaration[] = [];

  const visit = (node: ts.Node): void => {
    // EXAMPLES (each declaration introduces a name into the scope):
    //   function getApi() { ... }
    //            ^^^^^^ (function declaration)
    //   class PerpsStreamBridge { ... }
    //         ^^^^^^^^^^^^^^^^^ (class declaration)
    //   const api = { ... };
    //         ^^^ (variable declaration)
    //   function getApi(controller) { ... }
    //                   ^^^^^^^^^^ (parameter)
    //   const { messengerClientApi } = result;
    //           ^^^^^^^^^^^^^^^^^^ (binding element)
    if (
      isLexicalDeclaration(node) &&
      node.name !== undefined &&
      ts.isIdentifier(node.name) &&
      node.name.text === name
    ) {
      declarations.push(node);
    }

    // A nested function's name belongs to this scope, but nothing inside it
    // does, so stop after checking the node itself.
    if (isScope(node)) {
      return;
    }
    ts.forEachChild(node, visit);
  };

  // A function-like scope owns its parameters; its body is a separate block.
  if (ts.isFunctionLike(scope)) {
    for (const parameter of scope.parameters) {
      visit(parameter);
    }
    return declarations;
  }

  ts.forEachChild(scope, visit);
  return declarations;
}

/**
 * Determines whether a node declares a name that bare identifiers can use.
 *
 * @param node - The node to inspect.
 * @returns True for function, class, variable, parameter, and binding
 * declarations.
 */
function isLexicalDeclaration(node: ts.Node): node is LexicalDeclaration {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isVariableDeclaration(node) ||
    ts.isParameter(node) ||
    ts.isBindingElement(node)
  );
}

/**
 * Determines whether a node introduces a lexical scope.
 *
 * @param node - The node to inspect.
 * @returns True if declarations inside the node are local to it.
 */
function isScope(node: ts.Node): boolean {
  // EXAMPLES:
  //   function getApi(controller) { ... }
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ function-like (owns `controller`)
  //   if (condition) { const api = {}; }
  //                  ^^^^^^^^^^^^^^^^^^^ block
  //   for (const api of apis) { ... }
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ for statement (owns `api`)
  return (
    ts.isSourceFile(node) ||
    ts.isBlock(node) ||
    ts.isModuleBlock(node) ||
    ts.isCaseBlock(node) ||
    ts.isCatchClause(node) ||
    ts.isForStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isFunctionLike(node)
  );
}
