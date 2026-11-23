import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { hasProperty, isObject } from '@metamask/utils';
import ts from 'typescript';

/**
 * The error codes Node uses when a path does not name a readable file.
 *
 * Module resolution tries several candidate paths for each import, so these
 * errors are expected and mean "try the next candidate". Any other error, such
 * as a permission error, means something is genuinely wrong.
 */
const MISSING_FILE_ERROR_CODES = new Set(['ENOENT', 'ENOTDIR', 'EISDIR']);

/**
 * State shared by every step of one resolver run.
 *
 * Every resolution function receives this, so state that a whole run needs
 * lives here rather than being passed around separately.
 */
export type ResolutionContext = {
  /**
   * Source files keyed by their absolute path.
   *
   * Resolution follows imports on demand, so the same file may be requested
   * many times. Sharing parsed files keeps each run fast enough for the CLI.
   */
  sourceFilesByPath: Map<string, ts.SourceFile>;
  /**
   * The nodes currently being resolved, used to detect code that refers back
   * to itself, which would otherwise recurse until the stack overflows.
   *
   * Nodes are removed again once they have been resolved, so a node that is
   * reached through two different paths is not mistaken for a cycle.
   */
  nodesBeingResolved: Set<ts.Node>;
};

/**
 * Loads the file named by an import or re-export, if it is a relative path.
 *
 * @param declaration - The import or export statement.
 * @param context - The resolution context.
 * @returns The parsed file, or undefined if it cannot be found.
 */
export function loadImportedSourceFile(
  declaration: ts.ImportDeclaration | ts.ExportDeclaration,
  context: ResolutionContext,
): ts.SourceFile | undefined {
  const { moduleSpecifier } = declaration;
  if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) {
    return undefined;
  }

  // EXAMPLE:
  //   './wallet-init/instance-options/transaction-controller'
  return loadModuleSourceFile(
    declaration.getSourceFile(),
    moduleSpecifier.text,
    context,
  );
}

/**
 * Loads the file that a relative module specifier refers to.
 *
 * TypeScript can resolve imports for us, but that requires the heavier program-
 * based machinery we are avoiding here. This helper keeps the resolver focused
 * on the small set of relative imports that participate in the legacy API
 * snapshot.
 *
 * Each candidate path is loaded directly rather than checked for existence
 * first, so that every imported file is only read once.
 *
 * @param sourceFile - The file containing the import.
 * @param moduleSpecifier - The module specifier to resolve.
 * @param context - The resolution context.
 * @returns The parsed file, or undefined if no candidate path exists.
 */
function loadModuleSourceFile(
  sourceFile: ts.SourceFile,
  moduleSpecifier: string,
  context: ResolutionContext,
): ts.SourceFile | undefined {
  if (!moduleSpecifier.startsWith('.')) {
    return undefined;
  }

  // EXAMPLE:
  // './wallet-init/instance-options/transaction-controller'
  const sourceDirectory = path.dirname(sourceFile.fileName);
  const candidateBasePath = path.resolve(sourceDirectory, moduleSpecifier);
  const candidatePaths = [
    candidateBasePath,
    `${candidateBasePath}.ts`,
    `${candidateBasePath}.tsx`,
    `${candidateBasePath}.js`,
    `${candidateBasePath}.jsx`,
    path.join(candidateBasePath, 'index.ts'),
    path.join(candidateBasePath, 'index.tsx'),
    path.join(candidateBasePath, 'index.js'),
    path.join(candidateBasePath, 'index.jsx'),
  ];

  for (const candidatePath of candidatePaths) {
    const candidateSourceFile = loadSourceFileIfPresent(context, candidatePath);
    if (candidateSourceFile) {
      return candidateSourceFile;
    }
  }

  return undefined;
}

/**
 * Parses a source file, or returns undefined if the path does not name a file.
 *
 * @param context - The resolution context.
 * @param filePath - The path of the file to load.
 * @returns The parsed source file, if the file exists.
 */
function loadSourceFileIfPresent(
  context: ResolutionContext,
  filePath: string,
): ts.SourceFile | undefined {
  try {
    return getOrLoadSourceFile(context, filePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Parses a source file, reusing a previously parsed copy when one exists.
 *
 * @param context - The resolution context.
 * @param filePath - The path of the file to load.
 * @returns The parsed source file.
 */
export function getOrLoadSourceFile(
  context: ResolutionContext,
  filePath: string,
): ts.SourceFile {
  const resolvedFilePath = path.resolve(process.cwd(), filePath);
  const cachedSourceFile = context.sourceFilesByPath.get(resolvedFilePath);
  if (cachedSourceFile) {
    return cachedSourceFile;
  }

  const source = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    resolvedFilePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  context.sourceFilesByPath.set(resolvedFilePath, sourceFile);
  return sourceFile;
}

/**
 * Determines whether an error means that a path does not name a readable file.
 *
 * @param error - The error thrown while reading the path.
 * @returns True for missing files and for paths that name directories.
 */
function isMissingFileError(error: unknown): boolean {
  return (
    isObject(error) &&
    hasProperty(error, 'code') &&
    typeof error.code === 'string' &&
    MISSING_FILE_ERROR_CODES.has(error.code)
  );
}
