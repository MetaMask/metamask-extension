import ts from 'typescript';

/**
 * A function whose return values can be inspected.
 */
export type FunctionWithBody =
  | ts.FunctionDeclaration
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.ArrowFunction
  | ts.FunctionExpression;

/**
 * Unwraps parentheses and assertions from an expression.
 *
 * @param expression - The expression to unwrap.
 * @returns The unwrapped expression.
 */
export function unwrapExpression(expression: ts.Expression): ts.Expression {
  let currentExpression = expression;

  // EXAMPLE:
  //   ({ startSendingPatches } as Api)!
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  while (
    ts.isParenthesizedExpression(currentExpression) ||
    ts.isAsExpression(currentExpression) ||
    ts.isSatisfiesExpression(currentExpression) ||
    ts.isTypeAssertionExpression(currentExpression) ||
    ts.isNonNullExpression(currentExpression)
  ) {
    currentExpression = currentExpression.expression;
  }
  return currentExpression;
}

/**
 * Gets the text of a property-like name.
 *
 * @param name - The name node to read.
 * @returns The name text.
 */
export function getPropertyNameText(name: ts.PropertyName): string {
  // EXAMPLES:
  //   api
  //   ^^^    identifier
  //   'api'
  //   ^^^^^  string literal
  //   0
  //   ^      numeric literal
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return name.getText();
}

/**
 * Finds the class declaration that encloses a node.
 *
 * @param node - The node to inspect.
 * @returns The containing class declaration when one exists.
 */
export function getEnclosingClassDeclaration(
  node: ts.Node,
): ts.ClassDeclaration | undefined {
  let currentNode: ts.Node | undefined = node;

  // EXAMPLE:
  //   class MetamaskController {
  //     setupControllerConnection() { ... }
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   }
  while (currentNode) {
    if (ts.isClassDeclaration(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.parent;
  }

  return undefined;
}

/**
 * Finds the members of a class with a given name.
 *
 * @param classDeclaration - The class to search.
 * @param memberName - The name to find.
 * @returns The matching members.
 */
export function findClassMembers(
  classDeclaration: ts.ClassDeclaration,
  memberName: string,
): ts.ClassElement[] {
  return classDeclaration.members.filter(
    (member) =>
      member.name !== undefined &&
      getPropertyNameText(member.name) === memberName,
  );
}

/**
 * Visits the nodes of a function body, skipping nested functions and classes.
 *
 * Nested functions have their own `return` statements and their own `this`, so
 * their contents do not describe the outer function.
 *
 * @param body - The function body to visit.
 * @param callback - Called for each visited node.
 */
export function forEachNodeInFunctionBody(
  body: ts.Block,
  callback: (node: ts.Node) => void,
): void {
  const visit = (node: ts.Node): void => {
    callback(node);
    if (ts.isFunctionLike(node) || ts.isClassLike(node)) {
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(body, visit);
}

/**
 * Determines whether a node is a function whose return values can be followed.
 *
 * @param node - The node to inspect.
 * @returns True for arrow functions and function expressions.
 */
export function isFunctionWithBody(
  node: ts.Node,
): node is ts.ArrowFunction | ts.FunctionExpression {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

/**
 * Determines whether an expression is `null` or `undefined`.
 *
 * @param expression - The expression to inspect.
 * @returns True if the expression is a nullish literal.
 */
export function isNullishExpression(expression: ts.Expression): boolean {
  return (
    expression.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(expression) && expression.text === 'undefined')
  );
}
