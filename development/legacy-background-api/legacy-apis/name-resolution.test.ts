import assert from 'node:assert';
import * as path from 'node:path';
import ts from 'typescript';
import { ResolutionContext } from './module-resolution';
import { resolveDeclarations } from './name-resolution';

describe('resolveDeclarations', () => {
  it('finds a variable declared in the same scope', () => {
    const { identifier, context } = parseUsage(`
      const sharedApi = 'local';
      use(sharedApi);
    `);

    const declarations = resolveDeclarations(identifier, context);

    expect(getTexts(declarations)).toStrictEqual(["sharedApi = 'local'"]);
  });

  it('uses the innermost declaration of a shadowed name', () => {
    const { identifier, context } = parseUsage(`
      const sharedApi = 'outer';
      function setupControllerConnection() {
        const sharedApi = 'inner';
        use(sharedApi);
      }
    `);

    const declarations = resolveDeclarations(identifier, context);

    expect(getTexts(declarations)).toStrictEqual(["sharedApi = 'inner'"]);
  });

  it('ignores declarations in unrelated scopes', () => {
    const { identifier, context } = parseUsage(`
      function elsewhere() { const sharedApi = 'unrelated'; }
      const sharedApi = 'visible';
      use(sharedApi);
    `);

    const declarations = resolveDeclarations(identifier, context);

    expect(getTexts(declarations)).toStrictEqual(["sharedApi = 'visible'"]);
  });

  it('finds a function parameter', () => {
    const { identifier, context } = parseUsage(`
      function setupControllerConnection(sharedApi) {
        use(sharedApi);
      }
    `);

    const declarations = resolveDeclarations(identifier, context);

    expect(getTexts(declarations)).toStrictEqual(['sharedApi']);
  });

  it('returns no declarations for an unknown name', () => {
    const { identifier, context } = parseUsage('use(unknownApi);');

    const declarations = resolveDeclarations(identifier, context);

    expect(declarations).toStrictEqual([]);
  });

  it('follows an import into the imported file', () => {
    const { identifier, context } = parseUsage(`
      import { createApi } from './factory';
      use(createApi);
    `);
    addSource(context, 'factory.ts', "export const createApi = 'imported';");

    const declarations = resolveDeclarations(identifier, context);

    expect(getTexts(declarations)).toStrictEqual(["createApi = 'imported'"]);
    expect(getFileNames(declarations)).toStrictEqual(['factory.ts']);
  });

  it('follows a renamed import using the exported name', () => {
    const { identifier, context } = parseUsage(`
      import { createApi as createSharedApi } from './factory';
      use(createSharedApi);
    `);
    addSource(context, 'factory.ts', "export const createApi = 'imported';");

    const declarations = resolveDeclarations(identifier, context);

    expect(getTexts(declarations)).toStrictEqual(["createApi = 'imported'"]);
  });

  it('follows an import through a barrel file', () => {
    const { identifier, context } = parseUsage(`
      import { createApi } from './factories';
      use(createApi);
    `);
    addSource(
      context,
      'factories/index.ts',
      "export { createApi } from './create-api';",
    );
    addSource(
      context,
      'factories/create-api.ts',
      "export const createApi = 'imported';",
    );

    const declarations = resolveDeclarations(identifier, context);

    expect(getFileNames(declarations)).toStrictEqual([
      'factories/create-api.ts',
    ]);
  });

  it('follows a renamed re-export using the name in the source file', () => {
    const { identifier, context } = parseUsage(`
      import { createApi } from './factories';
      use(createApi);
    `);
    addSource(
      context,
      'factories/index.ts',
      "export { createSharedApi as createApi } from './create-api';",
    );
    addSource(
      context,
      'factories/create-api.ts',
      "export const createSharedApi = 'imported';",
    );

    const declarations = resolveDeclarations(identifier, context);

    expect(getTexts(declarations)).toStrictEqual([
      "createSharedApi = 'imported'",
    ]);
  });

  it('does not follow imports from packages', () => {
    const { identifier, context } = parseUsage(`
      import { createApi } from '@metamask/example';
      use(createApi);
    `);

    const declarations = resolveDeclarations(identifier, context);

    expect(declarations).toStrictEqual([]);
  });
});

/**
 * Parses a fixture and finds the identifier passed to `use(...)` in it.
 *
 * @param source - The source of the fixture, which must call `use` once.
 * @returns The identifier and a resolution context containing the fixture.
 */
function parseUsage(source: string) {
  const context = {
    sourceFilesByPath: new Map<string, ts.SourceFile>(),
    nodesBeingResolved: new Set<ts.Node>(),
  } satisfies ResolutionContext;
  const sourceFile = addSource(context, 'controller.ts', source);
  const identifier = findUsedIdentifier(sourceFile);

  return { identifier, context };
}

/**
 * Finds the identifier passed to `use(...)` in a source file.
 *
 * @param sourceFile - The source file to search.
 * @returns The identifier.
 */
function findUsedIdentifier(sourceFile: ts.SourceFile): ts.Identifier {
  let identifier: ts.Identifier | undefined;
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'use' &&
      ts.isIdentifier(node.arguments[0])
    ) {
      identifier = node.arguments[0];
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  assert(identifier, 'The fixture must call `use` with an identifier');
  return identifier;
}

/**
 * Adds a parsed file to a resolution context, so that it can be imported
 * without being read from disk.
 *
 * @param context - The resolution context.
 * @param fileName - The file name, relative to the working directory.
 * @param source - The source of the file.
 * @returns The parsed source file.
 */
function addSource(
  context: ResolutionContext,
  fileName: string,
  source: string,
): ts.SourceFile {
  const filePath = path.resolve(fileName);
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  context.sourceFilesByPath.set(filePath, sourceFile);
  return sourceFile;
}

/**
 * Reads the source text of declarations.
 *
 * @param declarations - The declarations to read.
 * @returns The text of each declaration.
 */
function getTexts(declarations: ts.Declaration[]): string[] {
  return declarations.map((declaration) => declaration.getText());
}

/**
 * Reads the files that declarations are in, relative to the working
 * directory.
 *
 * @param declarations - The declarations to inspect.
 * @returns The relative file name of each declaration.
 */
function getFileNames(declarations: ts.Declaration[]): string[] {
  return declarations.map((declaration) =>
    path.relative(process.cwd(), declaration.getSourceFile().fileName),
  );
}
