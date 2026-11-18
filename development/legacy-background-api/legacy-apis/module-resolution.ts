import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';

/**
 * A cache of parsed source files.
 *
 * Resolution follows imports on demand, so the same file may be requested
 * many times. Sharing parsed files keeps each run fast enough for the CLI.
 */
export type ResolutionContext = {
  /**
   * Source files keyed by their absolute path.
   */
  sourceFilesByPath: Map<string, ts.SourceFile>;
};

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
