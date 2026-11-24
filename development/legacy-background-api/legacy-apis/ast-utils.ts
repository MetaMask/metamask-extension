import ts from 'typescript';
import { UnresolvableExpressionError } from './errors';

/**
 * A function written inline as an expression, which always has a body.
 */
export type InlineFunctionWithBody = ts.ArrowFunction | ts.FunctionExpression;

/**
 * A function whose return values can be inspected.
 *
 * Function and method declarations can lack a body, as with TypeScript
 * overload signatures and `declare function`. Those only describe types, so
 * they are skipped when following a call to the code it runs.
 */
export type FunctionWithBody =
  | ts.FunctionDeclaration
  | ts.MethodDeclaration
  | InlineFunctionWithBody;

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
 * Gets the text of a property-like name, throwing if the name is only known at
 * runtime.
 *
 * This is used for names that are recorded in the snapshot, where writing
 * source text such as `[DYNAMIC_KEY]` instead of a real name would be wrong.
 *
 * @param name - The name node to read.
 * @returns The name text.
 */
export function getPropertyNameText(name: ts.PropertyName): string {
  const text = getStaticPropertyNameText(name);
  if (text === undefined) {
    throw new UnresolvableExpressionError(
      name,
      'Cannot determine the name of this property',
    );
  }
  return text;
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
      // A member whose name is only known at runtime, such as
      // `[Symbol.iterator]() { ... }`, cannot be the one being looked up, so
      // it is skipped rather than rejected.
      getStaticPropertyNameText(member.name) === memberName,
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
 * Determines whether a node is a function written inline as an expression.
 *
 * @param node - The node to inspect.
 * @returns True for arrow functions and function expressions.
 */
export function isInlineFunctionWithBody(
  node: ts.Node,
): node is InlineFunctionWithBody {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

/**
 * Determines whether a variable is declared with `const`.
 *
 * Only `const` variables can be followed to their initializer, since any other
 * variable may be reassigned later.
 *
 * @param variableDeclaration - The variable declaration to check.
 * @returns True if the variable is declared with `const`.
 */
export function isConstVariableDeclaration(
  variableDeclaration: ts.VariableDeclaration,
): boolean {
  // EXAMPLE:
  //   const api = { ... };
  //   ^^^^^
  // ANTI-EXAMPLE:
  //   let api = {};
  //   ^^^
  const declarationList = variableDeclaration.parent;
  return (
    ts.isVariableDeclarationList(declarationList) &&
    declarationList.getFirstToken()?.kind === ts.SyntaxKind.ConstKeyword
  );
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

/**
 * Gets the text of a property-like name, if it is known without running the
 * code.
 *
 * @param name - The name node to read.
 * @returns The name text, or undefined for a computed name that is not a
 * literal.
 */
function getStaticPropertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isComputedPropertyName(name)) {
    const { expression } = name;
    // EXAMPLES:
    //   {
    //     ['api']: ...
    //      ^^^^  string literal
    //     [42]: ...
    //      ^^    numeric literal
    //   }
    if (ts.isStringLiteralLike(expression) || ts.isNumericLiteral(expression)) {
      return expression.text;
    }
    // EXAMPLES:
    //   [DYNAMIC_KEY]: ...
    //    ^^^^^^^^^^^  dynamic key only known at runtime
    return undefined;
  }

  // EXAMPLES:
  //   api
  //   ^^^    identifier
  //   'api'
  //   ^^^^^  string literal
  //   42
  //   ^^     numeric literal
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return name.getText();
}
