import ts from 'typescript';
import {
  findClassMembers,
  forEachNodeInFunctionBody,
  FunctionWithBody,
  getEnclosingClassDeclaration,
  getPropertyNameText,
  isConstVariableDeclaration,
  isInlineFunctionWithBody,
  isNullishExpression,
  unwrapExpression,
} from './ast-utils';
import { UnresolvableExpressionError } from './errors';
import { ResolutionContext } from './module-resolution';
import { LexicalDeclaration, resolveDeclarations } from './name-resolution';

/**
 * Resolves the names of the properties that one object element contributes to
 * an object. An "object element" is either a key/value pair — which
 * contributes its own name — or a spread assignment — which contributes the
 * names of every object it may evaluate to.
 *
 * Note that although we are ultimately only interested in collecting *callable*
 * properties that make up the legacy background API, in practice we don't need
 * to make that distinction here, since the UI can only call functions anyway,
 * so extra, non-callable API properties would be go unused. Plus, proving that
 * a value is callable would mean following wrappers such as
 * `controller.method.bind(controller)` or `withAutoInit(...)` into library
 * code, which would add to the complexity of this whole parsing routine.
 *
 * @param objectElement - The object element to inspect.
 * @param context - The resolution context.
 * @returns The contributed property names.
 */
export function resolvePropertyNamesFromObjectElement(
  objectElement: ts.ObjectLiteralElementLike,
  context: ResolutionContext,
): Set<string> {
  // EXAMPLE:
  //   ...this.getApi(),
  //   ^^^^^^^^^^^^^^^^ spread assignment
  if (ts.isSpreadAssignment(objectElement)) {
    const names = new Set<string>();
    const objectLiterals = resolveGuaranteedObjectLiterals(
      objectElement.expression,
      context,
    );
    for (const objectLiteral of objectLiterals) {
      const propertyNames = collectPropertyNamesFromObject(
        objectLiteral,
        context,
      );
      for (const name of propertyNames) {
        names.add(name);
      }
    }
    return names;
  }

  // EXAMPLES:
  //   method() { ... }
  //   ^^^^^^ method declaration
  //   get method() { ... }
  //       ^^^^^^ getter
  //   setTheme: preferencesController.setTheme.bind(preferencesController),
  //   ^^^^^^^^ property assignment
  //   setParticipateInMetaMetrics,
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^ shorthand property assignment
  if (
    ts.isMethodDeclaration(objectElement) ||
    ts.isGetAccessorDeclaration(objectElement) ||
    ts.isPropertyAssignment(objectElement) ||
    ts.isShorthandPropertyAssignment(objectElement)
  ) {
    return new Set([getPropertyNameText(objectElement.name)]);
  }

  return new Set();
}

/**
 * Finds the object literals that an expression must evaluate to, throwing if
 * it may not evaluate to any.
 *
 * This is used for expressions whose properties are required, such as spreads.
 * `{ ...null }` is valid JavaScript, but a spread that never produces an object
 * is almost certainly code the resolver failed to understand.
 *
 * @param expression - The expression to resolve.
 * @param context - The resolution context.
 * @returns The object literals, of which there is at least one.
 */
export function resolveGuaranteedObjectLiterals(
  expression: ts.Expression,
  context: ResolutionContext,
): ts.ObjectLiteralExpression[] {
  const objectLiterals = resolveObjectLiterals(expression, context);
  if (objectLiterals.length === 0) {
    throw new UnresolvableExpressionError(
      expression,
      'This expression does not resolve to any object',
    );
  }
  return objectLiterals;
}

/**
 * Follows an expression (object literal, value, ternary, call expression,
 * variable, function call, property access, etc.) to object literals, if any.
 *
 * If given a ternary, both branches are followed, because either
 * may be taken at runtime. `null` and `undefined` produce no objects.
 *
 * @param expression - The expression to resolve.
 * @param context - The resolution context.
 * @returns The resolved object literals, which may be empty.
 */
export function resolveObjectLiterals(
  expression: ts.Expression,
  context: ResolutionContext,
): ts.ObjectLiteralExpression[] {
  const normalizedExpression = unwrapExpression(expression);

  return guardingAgainstCycles(normalizedExpression, context, () => {
    // EXAMPLE:
    //   { setTheme: preferencesController.setTheme.bind(preferencesController) }
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (ts.isObjectLiteralExpression(normalizedExpression)) {
      return [normalizedExpression];
    }

    // EXAMPLES:
    //   null
    //   undefined
    if (isNullishExpression(normalizedExpression)) {
      return [];
    }

    // EXAMPLE:
    //   perpsStream ? perpsStream.bridgeApi() : {}
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (ts.isConditionalExpression(normalizedExpression)) {
      return [
        ...resolveObjectLiterals(normalizedExpression.whenTrue, context),
        ...resolveObjectLiterals(normalizedExpression.whenFalse, context),
      ];
    }

    // EXAMPLE:
    //   getTransactionControllerApi(this.txController)
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (ts.isCallExpression(normalizedExpression)) {
      return resolveCallResults(normalizedExpression, context).flatMap(
        (result) => resolveObjectLiterals(result, context),
      );
    }

    // EXAMPLE:
    //   sharedApi
    //   ^^^^^^^^^
    if (ts.isIdentifier(normalizedExpression)) {
      return resolveIdentifierValues(normalizedExpression, context).flatMap(
        (value) => resolveObjectLiterals(value, context),
      );
    }

    throw new UnresolvableExpressionError(
      normalizedExpression,
      'Cannot determine which object this expression produces',
    );
  });
}

/**
 * Finds the expressions that a call may return.
 *
 * @param callExpression - The call to inspect.
 * @param context - The resolution context.
 * @returns The returned expressions.
 */
function resolveCallResults(
  callExpression: ts.CallExpression,
  context: ResolutionContext,
): ts.Expression[] {
  // EXAMPLE:
  //   getTransactionControllerApi(this.txController)
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^ callee (`callExpression.expression`)
  const functions = resolveFunctions(callExpression.expression, context);
  return functions.flatMap(collectReturnExpressions);
}

/**
 * Finds the functions that an expression refers to. Handles arrow functions,
 * direct calls, and function values stored in variables (such as the init
 * functions of messenger clients).
 *
 * @param expression - The expression that refers to a function.
 * @param context - The resolution context.
 * @returns The functions, of which there is at least one.
 */
export function resolveFunctions(
  expression: ts.Expression,
  context: ResolutionContext,
): FunctionWithBody[] {
  const normalizedExpression = unwrapExpression(expression);

  return guardingAgainstCycles(normalizedExpression, context, () => {
    // EXAMPLE:
    //   () => ({ startSendingPatches })
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (isInlineFunctionWithBody(normalizedExpression)) {
      return [normalizedExpression];
    }

    // EXAMPLE:
    //   perpsStream.bridgeApi
    //   ^^^^^^^^^^^^^^^^^^^^^ (as in `perpsStream.bridgeApi()`)
    if (ts.isPropertyAccessExpression(normalizedExpression)) {
      return resolveMethods(normalizedExpression, context);
    }

    // EXAMPLE:
    //   getTransactionControllerApi
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^ (as in `getTransactionControllerApi(...)`)
    if (ts.isIdentifier(normalizedExpression)) {
      const declarations = resolveGuaranteedDeclarations(
        normalizedExpression,
        context,
      );
      const functions = declarations.flatMap((declaration) => {
        // EXAMPLE:
        //   function getTransactionControllerApi(transactionController) { ... }
        //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        if (ts.isFunctionDeclaration(declaration)) {
          // An overload signature is still a function declaration, but skip it
          // since it doesn't have a body.
          // EXAMPLE:
          //   function getTransactionControllerApi(): Api;
          //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          return declaration.body ? [declaration] : [];
        }

        // EXAMPLE:
        //   const PerpsControllerInit = (request) => { ... };
        //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        return resolveDeclarationValues(declaration, context).flatMap((value) =>
          resolveFunctions(value, context),
        );
      });

      if (functions.length === 0) {
        throw new UnresolvableExpressionError(
          normalizedExpression,
          `Cannot find an implementation of "${normalizedExpression.text}"`,
        );
      }
      return functions;
    }

    throw new UnresolvableExpressionError(
      normalizedExpression,
      'Cannot determine which function this expression refers to',
    );
  });
}

/**
 * Finds the methods that a property access refers to on its receiver's classes.
 *
 * @param propertyAccessExpression - The property access, such as
 * `perpsStream.bridgeApi`.
 * @param context - The resolution context.
 * @returns The methods, of which there is at least one.
 */
function resolveMethods(
  propertyAccessExpression: ts.PropertyAccessExpression,
  context: ResolutionContext,
): FunctionWithBody[] {
  const memberName = getPropertyNameText(propertyAccessExpression.name);
  const classDeclarations = resolveRequiredReceiverClasses(
    propertyAccessExpression.expression,
    context,
  );

  const methods: FunctionWithBody[] = [];
  for (const classDeclaration of classDeclarations) {
    for (const member of findClassMembers(classDeclaration, memberName)) {
      // EXAMPLE:
      //   class PerpsStreamBridge {
      //     bridgeApi() { ... }
      //     ^^^^^^^^^^^^^^^^^^^ method declaration
      //   }
      if (ts.isMethodDeclaration(member) && member.body) {
        methods.push(member);
      }
    }
  }

  if (methods.length === 0) {
    throw new UnresolvableExpressionError(
      propertyAccessExpression,
      `Cannot find a method named "${memberName}" on the receiver's class`,
    );
  }
  return methods;
}

/**
 * Finds the classes that a receiver expression may be an instance of, throwing
 * if there are none.
 *
 * @param expression - The receiver, such as `perpsStream` in
 * `perpsStream.bridgeApi()`.
 * @param context - The resolution context.
 * @returns The classes, of which there is at least one.
 */
function resolveRequiredReceiverClasses(
  expression: ts.Expression,
  context: ResolutionContext,
): ts.ClassDeclaration[] {
  const classDeclarations = resolveReceiverClasses(expression, context);
  if (classDeclarations.length === 0) {
    throw new UnresolvableExpressionError(
      expression,
      'Cannot determine which class this expression is an instance of',
    );
  }
  return classDeclarations;
}

/**
 * Finds the classes that an expression may be an instance of.
 *
 * @param expression - The expression to resolve.
 * @param context - The resolution context.
 * @returns The classes, which may be empty.
 */
function resolveReceiverClasses(
  expression: ts.Expression,
  context: ResolutionContext,
): ts.ClassDeclaration[] {
  const normalizedExpression = unwrapExpression(expression);

  return guardingAgainstCycles(normalizedExpression, context, () => {
    // EXAMPLE:
    //   this.getApi()
    //   ^^^^
    if (normalizedExpression.kind === ts.SyntaxKind.ThisKeyword) {
      const classDeclaration =
        getEnclosingClassDeclaration(normalizedExpression);
      if (!classDeclaration) {
        throw new UnresolvableExpressionError(
          normalizedExpression,
          'Cannot find the class that `this` refers to',
        );
      }
      return [classDeclaration];
    }

    // EXAMPLES:
    //   null
    //   undefined
    if (isNullishExpression(normalizedExpression)) {
      return [];
    }

    // EXAMPLE:
    //   new PerpsStreamBridge(options)
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ new expression
    //       ^^^^^^^^^^^^^^^^^ identifier naming the class
    if (ts.isNewExpression(normalizedExpression)) {
      return resolveConstructedClasses(normalizedExpression, context);
    }

    // EXAMPLE:
    //   perpsController ? new PerpsStreamBridge(options) : null
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (ts.isConditionalExpression(normalizedExpression)) {
      return [
        ...resolveReceiverClasses(normalizedExpression.whenTrue, context),
        ...resolveReceiverClasses(normalizedExpression.whenFalse, context),
      ];
    }

    // EXAMPLE:
    //   perpsStream
    //   ^^^^^^^^^^^
    if (ts.isIdentifier(normalizedExpression)) {
      return resolveIdentifierValues(normalizedExpression, context).flatMap(
        (value) => resolveReceiverClasses(value, context),
      );
    }

    throw new UnresolvableExpressionError(
      normalizedExpression,
      'Cannot determine which class this expression is an instance of',
    );
  });
}

/**
 * Finds the class instantiated by a `new` expression.
 *
 * @param newExpression - The `new` expression to inspect.
 * @param context - The resolution context.
 * @returns The classes, of which there is at least one.
 */
function resolveConstructedClasses(
  newExpression: ts.NewExpression,
  context: ResolutionContext,
): ts.ClassDeclaration[] {
  const classReference = unwrapExpression(newExpression.expression);
  if (!ts.isIdentifier(classReference)) {
    throw new UnresolvableExpressionError(
      newExpression,
      'Cannot determine which class this expression instantiates',
    );
  }

  const declarations = resolveGuaranteedDeclarations(classReference, context);
  const classDeclarations = declarations.filter(ts.isClassDeclaration);
  if (classDeclarations.length !== declarations.length) {
    throw new UnresolvableExpressionError(
      classReference,
      'This name does not refer to a class declaration',
    );
  }
  return classDeclarations;
}

/**
 * Finds the values that an identifier may refer to.
 *
 * @param identifier - The identifier to resolve.
 * @param context - The resolution context.
 * @returns The values, of which there is at least one.
 */
function resolveIdentifierValues(
  identifier: ts.Identifier,
  context: ResolutionContext,
): ts.Expression[] {
  const declarations = resolveGuaranteedDeclarations(identifier, context);
  return declarations.flatMap((declaration) =>
    resolveDeclarationValues(declaration, context),
  );
}

/**
 * Finds the declarations of an identifier, throwing if there are none.
 *
 * @param identifier - The identifier to resolve.
 * @param context - The resolution context.
 * @returns The declarations, of which there is at least one.
 */
function resolveGuaranteedDeclarations(
  identifier: ts.Identifier,
  context: ResolutionContext,
): LexicalDeclaration[] {
  const declarations = resolveDeclarations(identifier, context);
  if (declarations.length === 0) {
    throw new UnresolvableExpressionError(
      identifier,
      `Cannot find a definition for "${identifier.text}"`,
    );
  }
  return declarations;
}

/**
 * Finds the values that a declaration gives its name.
 *
 * Only `const` variables are followed: other variables may be reassigned,
 * which would make their initializer an incomplete answer.
 *
 * @param declaration - The declaration to inspect.
 * @param context - The resolution context.
 * @returns The values, of which there is at least one.
 */
function resolveDeclarationValues(
  declaration: LexicalDeclaration,
  context: ResolutionContext,
): ts.Expression[] {
  // EXAMPLE:
  //   const perpsStream = perpsController ? new PerpsStreamBridge(...) : null;
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ variable declaration
  if (ts.isVariableDeclaration(declaration)) {
    assertConstDeclaration(declaration);
    if (!declaration.initializer) {
      throw new UnresolvableExpressionError(
        declaration,
        'Cannot follow a variable without an initializer',
      );
    }
    return [declaration.initializer];
  }

  // ANTI-EXAMPLES:
  //   const { api } = options;    (destructuring is not followed)
  //   function getApi() { ... }   (a function, not an object)
  //   class Bridge { ... }        (a class, not an object)
  //   function f(api) { ... }     (a parameter, whose value depends on callers)
  throw new UnresolvableExpressionError(
    declaration,
    'Cannot follow this kind of definition to a value',
  );
}

/**
 * Throws unless a variable is declared with `const`.
 *
 * @param variableDeclaration - The variable declaration to check.
 */
function assertConstDeclaration(
  variableDeclaration: ts.VariableDeclaration,
): void {
  if (!isConstVariableDeclaration(variableDeclaration)) {
    throw new UnresolvableExpressionError(
      variableDeclaration,
      'Cannot follow a variable that is not declared with const, since it may be reassigned',
    );
  }
}

/**
 * Collects the expressions that a function may return.
 *
 * This lets the resolver follow a call, such as `this.getApi()` or a
 * messenger client init function, to the objects it produces. Every `return`
 * is collected, not just the first, because a function with several returns
 * usually picks one of them at runtime. For example, an init function might
 * return `{ messengerClient }` early when a feature is disabled and
 * `{ messengerClient, api }` otherwise. Following only one return would
 * silently drop the methods in the others, so every path is followed and
 * the snapshot includes any method that some path could expose.
 *
 * Return statements in nested functions are skipped, since they return from
 * those functions instead.
 *
 * @param functionWithBody - The function to inspect.
 * @returns The returned expressions.
 */
export function collectReturnExpressions(
  functionWithBody: FunctionWithBody,
): ts.Expression[] {
  const { body } = functionWithBody;
  if (!body) {
    throw new UnresolvableExpressionError(
      functionWithBody,
      'Cannot inspect the return value of a function without a body',
    );
  }

  // EXAMPLE:
  //   () => ({ startSendingPatches })
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^ concise body
  if (!ts.isBlock(body)) {
    return [body];
  }

  const expressions: ts.Expression[] = [];
  forEachNodeInFunctionBody(body, (node) => {
    // EXAMPLE:
    //   return { startSendingPatches };
    //          ^^^^^^^^^^^^^^^^^^^^^^^ expression
    if (ts.isReturnStatement(node) && node.expression) {
      expressions.push(node.expression);
    }
  });
  return expressions;
}

/**
 * Collects the top-level property names of an object literal, including the
 * names contributed by its spreads.
 *
 * @param objectLiteral - The object literal to inspect.
 * @param context - The resolution context.
 * @returns The property names.
 */
export function collectPropertyNamesFromObject(
  objectLiteral: ts.ObjectLiteralExpression,
  context: ResolutionContext,
): Set<string> {
  const names = guardingAgainstCycles(objectLiteral, context, () =>
    objectLiteral.properties.flatMap((objectElement) => [
      ...resolvePropertyNamesFromObjectElement(objectElement, context),
    ]),
  );
  return new Set(names);
}

/**
 * Resolves a node, throwing if it is already being resolved further up.
 *
 * Code that refers back to itself, such as two objects that spread each other,
 * would otherwise recurse until the stack overflows. Throwing instead points at
 * the code that closes the loop.
 *
 * For example, given:
 *
 * ```js
 * const firstApi = { ...secondApi };
 * const secondApi = { ...firstApi };
 * const api = { ...firstApi };
 * ```
 *
 * Collecting the names in `api` follows `firstApi` to its object, which
 * spreads `secondApi`, whose object spreads `firstApi` again. The object
 * assigned to `firstApi` is still being resolved at that point, so this throws
 * an error pointing at `{ ...secondApi }`.
 *
 * @param node - The node about to be resolved.
 * @param context - The resolution context.
 * @param resolve - Resolves the node.
 * @returns The result of `resolve`.
 */
function guardingAgainstCycles<Value>(
  node: ts.Node,
  context: ResolutionContext,
  resolve: () => Value[],
): Value[] {
  if (context.nodesBeingResolved.has(node)) {
    throw new UnresolvableExpressionError(
      node,
      'This expression refers back to itself',
    );
  }

  context.nodesBeingResolved.add(node);
  try {
    return resolve();
  } finally {
    // Remove node once it has been resolved, so a node that is reached twice
    // through separate paths, rather than through itself, is not mistaken for a
    // cycle.
    context.nodesBeingResolved.delete(node);
  }
}
