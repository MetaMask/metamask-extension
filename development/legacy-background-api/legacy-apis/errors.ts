import * as path from 'node:path';
import ts from 'typescript';

/**
 * Thrown when the resolver encounters code that it cannot follow.
 *
 * The legacy background API snapshot is only useful if it is complete, so
 * rather than silently skipping code it does not understand, the resolver
 * fails loudly and points at the code that needs attention.
 */
export class UnresolvableExpressionError extends Error {
  /**
   * Creates an error that describes the code that could not be followed.
   *
   * @param node - The node that could not be followed.
   * @param reason - Why the node could not be followed.
   */
  constructor(node: ts.Node, reason: string) {
    super(`${reason}:\n  ${describeNode(node)}`);
    this.name = 'UnresolvableExpressionError';
  }
}

/**
 * Describes a node's location and source text for error messages.
 *
 * @param node - The node to describe.
 * @returns A description such as `app/scripts/foo.js:12: this.getApi()`.
 */
function describeNode(node: ts.Node): string {
  const sourceFile = node.getSourceFile();
  const { line } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  const text = node.getText(sourceFile).replace(/\s+/gu, ' ');
  const truncatedText = text.length > 100 ? `${text.slice(0, 100)}…` : text;
  return `${path.relative(process.cwd(), sourceFile.fileName)}:${
    line + 1
  }: ${truncatedText}`;
}
