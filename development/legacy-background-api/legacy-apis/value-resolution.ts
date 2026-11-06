import ts from 'typescript';
import {
  findClassMembers,
  forEachNodeInFunctionBody,
  FunctionWithBody,
  getEnclosingClassDeclaration,
  getPropertyNameText,
  isFunctionWithBody,
  isNullishExpression,
  unwrapExpression,
} from './ast-utils';
import { UnresolvableExpressionError } from './errors';
import { ResolutionContext } from './module-resolution';
import { LexicalDeclaration, resolveDeclarations } from './name-resolution';

/**
 * The nodes currently being resolved, used to stop circular references.
 *
 * Nodes are removed again once they have been resolved, so a node that is
 * reached through two different paths is still resolved both times; only a
 * node that leads back to itself is cut short.
 */
type ResolutionStack = Set<ts.Node>;

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
 * @param stack - The nodes currently being resolved.
 * @returns The contributed property names.
 */
export function resolvePropertyNamesFromObjectElement(
  objectElement: ts.ObjectLiteralElementLike,
  context: ResolutionContext,
  stack: ResolutionStack = new Set(),
): Set<string> {
  // EXAMPLE:
  //   ...this.getApi(),
  //   ^^^^^^^^^^^^^^^^ spread assignment
  if (ts.isSpreadAssignment(objectElement)) {
    const names = new Set<string>();
    const objectLiterals = resolveGuaranteedObjectLiterals(
      objectElement.expression,
      context,
      stack,
    );
    for (const objectLiteral of objectLiterals) {
      const propertyNames = collectPropertyNamesFromObject(
        objectLiteral,
        context,
        stack,
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
 * Collects the top-level property names of an object literal, including the
 * names contributed by its spreads.
 *
 * @param objectLiteral - The object literal to inspect.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The property names.
 */
export function collectPropertyNamesFromObject(
  objectLiteral: ts.ObjectLiteralExpression,
  context: ResolutionContext,
  stack: ResolutionStack = new Set(),
): Set<string> {
  const names = guardingAgainstCycles(objectLiteral, stack, () =>
    objectLiteral.properties.flatMap((objectElement) => [
      ...resolvePropertyNamesFromObjectElement(objectElement, context, stack),
    ]),
  );
  return new Set(names);
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
 * @param stack - The nodes currently being resolved.
 * @returns The object literals, of which there is at least one.
 */
export function resolveGuaranteedObjectLiterals(
  expression: ts.Expression,
  context: ResolutionContext,
  stack: ResolutionStack = new Set(),
): ts.ObjectLiteralExpression[] {
  const objectLiterals = resolveObjectLiterals(expression, context, stack);
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
 * @param stack - The nodes currently being resolved.
 * @returns The resolved object literals, which may be empty.
 */
export function resolveObjectLiterals(
  expression: ts.Expression,
  context: ResolutionContext,
  stack: ResolutionStack = new Set(),
): ts.ObjectLiteralExpression[] {
  const normalizedExpression = unwrapExpression(expression);

  return guardingAgainstCycles(normalizedExpression, stack, () => {
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
        ...resolveObjectLiterals(normalizedExpression.whenTrue, context, stack),
        ...resolveObjectLiterals(
          normalizedExpression.whenFalse,
          context,
          stack,
        ),
      ];
    }

    // EXAMPLE:
    //   getTransactionControllerApi(this.txController)
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (ts.isCallExpression(normalizedExpression)) {
      return resolveCallResults(normalizedExpression, context, stack).flatMap(
        (result) => resolveObjectLiterals(result, context, stack),
      );
    }

    // EXAMPLE:
    //   sharedApi
    //   ^^^^^^^^^
    if (ts.isIdentifier(normalizedExpression)) {
      return resolveIdentifierValues(
        normalizedExpression,
        context,
        stack,
      ).flatMap((value) => resolveObjectLiterals(value, context, stack));
    }

    // EXAMPLE:
    //   this.sharedApi
    //   ^^^^^^^^^^^^^^
    if (ts.isPropertyAccessExpression(normalizedExpression)) {
      return resolvePropertyValues(
        normalizedExpression,
        context,
        stack,
      ).flatMap((value) => resolveObjectLiterals(value, context, stack));
    }

    throw new UnresolvableExpressionError(
      normalizedExpression,
      'Cannot determine which object this expression produces',
    );
  });
}

/**
 * Finds the values that an object literal may assign to one property.
 *
 * Properties contributed by spreads are included. All matches are returned
 * rather than only the last one, because which spread wins can depend on
 * runtime values.
 *
 * @param objectLiteral - The object literal to search.
 * @param propertyName - The name of the property to find.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The expressions that may be assigned to the property.
 */
export function collectPropertyValuesFromObject(
  objectLiteral: ts.ObjectLiteralExpression,
  propertyName: string,
  context: ResolutionContext,
  stack: ResolutionStack = new Set(),
): ts.Expression[] {
  return guardingAgainstCycles(objectLiteral, stack, () =>
    objectLiteral.properties.flatMap((objectElement) =>
      resolvePropertyValuesFromObjectElement(
        objectElement,
        propertyName,
        context,
        stack,
      ),
    ),
  );
}

/**
 * Finds the values that one object element may assign to a property.
 *
 * @param objectElement - The object element to inspect.
 * @param propertyName - The name of the property to find.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The expressions that may be assigned to the property.
 */
function resolvePropertyValuesFromObjectElement(
  objectElement: ts.ObjectLiteralElementLike,
  propertyName: string,
  context: ResolutionContext,
  stack: ResolutionStack,
): ts.Expression[] {
  // EXAMPLE:
  //   { ...getRampsControllerApi(messengerClient, platform) }
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ spread assignment
  if (ts.isSpreadAssignment(objectElement)) {
    const objectLiterals = resolveGuaranteedObjectLiterals(
      objectElement.expression,
      context,
      stack,
    );
    return objectLiterals.flatMap((spreadObjectLiteral) =>
      collectPropertyValuesFromObject(
        spreadObjectLiteral,
        propertyName,
        context,
        stack,
      ),
    );
  }

  if (
    objectElement.name === undefined ||
    getPropertyNameText(objectElement.name) !== propertyName
  ) {
    return [];
  }

  // EXAMPLE:
  //   { api: getApi(messengerClient) }
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ property assignment
  //          ^^^^^^^^^^^^^^^^^^^^^^^ initializer
  if (ts.isPropertyAssignment(objectElement)) {
    return [objectElement.initializer];
  }

  // EXAMPLE:
  //   { messengerClient, api }
  //                      ^^^ shorthand property assignment
  if (ts.isShorthandPropertyAssignment(objectElement)) {
    return [objectElement.name];
  }

  // EXAMPLE:
  //   { get api() { return { ... }; } }
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ getter
  if (ts.isGetAccessorDeclaration(objectElement)) {
    return collectReturnExpressions(objectElement);
  }

  throw new UnresolvableExpressionError(
    objectElement,
    'Cannot determine the value of this property',
  );
}

/**
 * Finds the functions that an expression refers to. Handles arrow functions,
 * direct calls, and function values stored in variables (such as the init
 * functions of messenger clients).
 *
 * @param expression - The expression that refers to a function.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The functions, of which there is at least one.
 */
export function resolveFunctions(
  expression: ts.Expression,
  context: ResolutionContext,
  stack: ResolutionStack = new Set(),
): FunctionWithBody[] {
  const normalizedExpression = unwrapExpression(expression);

  // EXAMPLE:
  //   () => ({ startSendingPatches })
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  if (isFunctionWithBody(normalizedExpression)) {
    return [normalizedExpression];
  }

  // EXAMPLE:
  //   perpsStream.bridgeApi
  //   ^^^^^^^^^^^^^^^^^^^^^ (as in `perpsStream.bridgeApi()`)
  if (ts.isPropertyAccessExpression(normalizedExpression)) {
    return resolveMethods(normalizedExpression, context, stack);
  }

  // EXAMPLE:
  //   getTransactionControllerApi
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^ (as in `getTransactionControllerApi(...)`)
  if (ts.isIdentifier(normalizedExpression)) {
    const declarations = resolveGuaranteedDeclarations(
      normalizedExpression,
      context,
    );
    return declarations.flatMap((declaration) => {
      // EXAMPLE:
      //   function getTransactionControllerApi(transactionController) { ... }
      //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      if (ts.isFunctionDeclaration(declaration) && declaration.body) {
        return [declaration];
      }

      // EXAMPLE:
      //   const PerpsControllerInit = (request) => { ... };
      //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      return resolveDeclarationValues(declaration, context, stack).flatMap(
        (value) => resolveFunctions(value, context, stack),
      );
    });
  }

  throw new UnresolvableExpressionError(
    normalizedExpression,
    'Cannot determine which function this expression refers to',
  );
}

/**
 * Collects the expressions that a function may return.
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
 * Finds the expressions that a call may return.
 *
 * @param callExpression - The call to inspect.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The returned expressions.
 */
function resolveCallResults(
  callExpression: ts.CallExpression,
  context: ResolutionContext,
  stack: ResolutionStack,
): ts.Expression[] {
  // EXAMPLE:
  //   getTransactionControllerApi(this.txController)
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^ callee (`callExpression.expression`)
  const functions = resolveFunctions(callExpression.expression, context, stack);
  return functions.flatMap(collectReturnExpressions);
}

/**
 * Finds the methods that a property access refers to on its receiver's classes.
 *
 * @param propertyAccessExpression - The property access, such as
 * `perpsStream.bridgeApi`.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The methods, of which there is at least one.
 */
function resolveMethods(
  propertyAccessExpression: ts.PropertyAccessExpression,
  context: ResolutionContext,
  stack: ResolutionStack,
): FunctionWithBody[] {
  const memberName = getPropertyNameText(propertyAccessExpression.name);
  const classDeclarations = resolveRequiredReceiverClasses(
    propertyAccessExpression.expression,
    context,
    stack,
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
        continue;
      }

      // EXAMPLE:
      //   class PerpsStreamBridge {
      //     bridgeApi = () => ({ ... });
      //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ property declaration
      //   }
      if (ts.isPropertyDeclaration(member) && member.initializer) {
        methods.push(...resolveFunctions(member.initializer, context, stack));
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
 * Finds the values that a property access may read from its receiver's classes.
 *
 * Fields, getters, and assignments in constructors are followed. A method is
 * rejected, because the value of a method reference is the function itself,
 * not the object it returns.
 *
 * @param propertyAccessExpression - The property access, such as
 * `this.messengerClientApi`.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The values, of which there is at least one.
 */
function resolvePropertyValues(
  propertyAccessExpression: ts.PropertyAccessExpression,
  context: ResolutionContext,
  stack: ResolutionStack,
): ts.Expression[] {
  const memberName = getPropertyNameText(propertyAccessExpression.name);
  const classDeclarations = resolveRequiredReceiverClasses(
    propertyAccessExpression.expression,
    context,
    stack,
  );

  const values = classDeclarations.flatMap((classDeclaration) =>
    resolveClassPropertyValues(
      classDeclaration,
      propertyAccessExpression,
      memberName,
    ),
  );

  if (values.length === 0) {
    throw new UnresolvableExpressionError(
      propertyAccessExpression,
      `Cannot find a value for "${memberName}" on the receiver's class`,
    );
  }
  return values;
}

/**
 * Finds the values that one class may store under a property name.
 *
 * @param classDeclaration - The class to search.
 * @param propertyAccessExpression - The property access being resolved, used
 * for error messages.
 * @param memberName - The property name to find.
 * @returns The values, which may be empty.
 */
function resolveClassPropertyValues(
  classDeclaration: ts.ClassDeclaration,
  propertyAccessExpression: ts.PropertyAccessExpression,
  memberName: string,
): ts.Expression[] {
  const values: ts.Expression[] = [];

  for (const member of findClassMembers(classDeclaration, memberName)) {
    // ANTI-EXAMPLE (spreading `this.getApi` spreads a function, not its result):
    //   class MetamaskController {
    //     getApi() { ... }
    //     ^^^^^^^^^^^^^^^^ method declaration
    //   }
    if (ts.isMethodDeclaration(member)) {
      throw new UnresolvableExpressionError(
        propertyAccessExpression,
        `"${memberName}" is a method; call it to use the object it returns`,
      );
    }

    // EXAMPLE:
    //   class MetamaskController {
    //     get api() { return { ... }; }
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ getter
    //   }
    if (ts.isGetAccessorDeclaration(member)) {
      values.push(...collectReturnExpressions(member));
    }

    // EXAMPLE:
    //   class MetamaskController {
    //     messengerClientApi = { ... };
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ property declaration
    //   }
    if (ts.isPropertyDeclaration(member) && member.initializer) {
      values.push(member.initializer);
    }
  }

  // Fields are often declared without an initializer, or not declared at all,
  // and assigned in the constructor instead. Checking constructors only after
  // members gives initialized fields priority.
  if (values.length === 0) {
    values.push(...collectConstructorAssignments(classDeclaration, memberName));
  }
  return values;
}

/**
 * Collects the values assigned to `this.<memberName>` in a class's constructor.
 *
 * @param classDeclaration - The class to search.
 * @param memberName - The property name to find.
 * @returns The assigned values.
 */
function collectConstructorAssignments(
  classDeclaration: ts.ClassDeclaration,
  memberName: string,
): ts.Expression[] {
  const values: ts.Expression[] = [];

  for (const member of classDeclaration.members) {
    if (!ts.isConstructorDeclaration(member) || !member.body) {
      continue;
    }

    forEachNodeInFunctionBody(member.body, (node) => {
      // EXAMPLE:
      //   this.messengerClientApi = messengerClientApi;
      //   ^^^^^^^^^^^^^^^^^^^^^^^ left (property access on `this`)
      //                             ^^^^^^^^^^^^^^^^^^ right
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) &&
        node.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
        getPropertyNameText(node.left.name) === memberName
      ) {
        values.push(node.right);
      }
    });
  }

  return values;
}

/**
 * Finds the classes that a receiver expression may be an instance of, throwing
 * if there are none.
 *
 * @param expression - The receiver, such as `perpsStream` in
 * `perpsStream.bridgeApi()`.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The classes, of which there is at least one.
 */
function resolveRequiredReceiverClasses(
  expression: ts.Expression,
  context: ResolutionContext,
  stack: ResolutionStack,
): ts.ClassDeclaration[] {
  const classDeclarations = resolveReceiverClasses(expression, context, stack);
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
 * @param stack - The nodes currently being resolved.
 * @returns The classes, which may be empty.
 */
function resolveReceiverClasses(
  expression: ts.Expression,
  context: ResolutionContext,
  stack: ResolutionStack,
): ts.ClassDeclaration[] {
  const normalizedExpression = unwrapExpression(expression);

  return guardingAgainstCycles(normalizedExpression, stack, () => {
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
        ...resolveReceiverClasses(
          normalizedExpression.whenTrue,
          context,
          stack,
        ),
        ...resolveReceiverClasses(
          normalizedExpression.whenFalse,
          context,
          stack,
        ),
      ];
    }

    // EXAMPLE:
    //   createPerpsStream(options)
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (ts.isCallExpression(normalizedExpression)) {
      return resolveCallResults(normalizedExpression, context, stack).flatMap(
        (result) => resolveReceiverClasses(result, context, stack),
      );
    }

    // EXAMPLE:
    //   perpsStream
    //   ^^^^^^^^^^^
    if (ts.isIdentifier(normalizedExpression)) {
      return resolveIdentifierValues(
        normalizedExpression,
        context,
        stack,
      ).flatMap((value) => resolveReceiverClasses(value, context, stack));
    }

    // EXAMPLE:
    //   this.perpsStream
    //   ^^^^^^^^^^^^^^^^
    if (ts.isPropertyAccessExpression(normalizedExpression)) {
      return resolvePropertyValues(
        normalizedExpression,
        context,
        stack,
      ).flatMap((value) => resolveReceiverClasses(value, context, stack));
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
 * @param stack - The nodes currently being resolved.
 * @returns The values, of which there is at least one.
 */
function resolveIdentifierValues(
  identifier: ts.Identifier,
  context: ResolutionContext,
  stack: ResolutionStack,
): ts.Expression[] {
  const declarations = resolveGuaranteedDeclarations(identifier, context);
  return declarations.flatMap((declaration) =>
    resolveDeclarationValues(declaration, context, stack),
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
 * @param stack - The nodes currently being resolved.
 * @returns The values, of which there is at least one.
 */
function resolveDeclarationValues(
  declaration: LexicalDeclaration,
  context: ResolutionContext,
  stack: ResolutionStack,
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

  // EXAMPLE:
  //   const { originalApi: myApi } = options;
  //           ^^^^^^^^^^^^^^^^^^ binding element
  if (ts.isBindingElement(declaration)) {
    return resolveBindingElementValues(declaration, context, stack);
  }

  // ANTI-EXAMPLES:
  //   function getApi() { ... }   (a function, not an object)
  //   class Bridge { ... }        (a class, not an object)
  //   function f(api) { ... }     (a parameter, whose value depends on callers)
  throw new UnresolvableExpressionError(
    declaration,
    'Cannot follow this kind of definition to a value',
  );
}

/**
 * Finds the values that one destructured binding selects from its source.
 *
 * For `const { originalApi: myApi } = options`, this selects the values of
 * `options.originalApi`, not every property in `options`.
 *
 * @param bindingElement - The binding element, such as `originalApi: myApi`.
 * @param context - The resolution context.
 * @param stack - The nodes currently being resolved.
 * @returns The selected values, of which there is at least one.
 */
function resolveBindingElementValues(
  bindingElement: ts.BindingElement,
  context: ResolutionContext,
  stack: ResolutionStack,
): ts.Expression[] {
  // EXAMPLE:
  //   const { firstApi, originalApi: myApi } = options;
  //                     ^^^^^^^^^^^^^^^^^^ binding element (`bindingElement`)
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ object binding pattern (`bindingPattern`)
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ variable declaration (`variableDeclaration`)
  //
  // ANTI-EXAMPLES:
  //   const { ...remainingApi } = options;
  //           ^^^ dotDotDotToken (object rest binding)
  //   const [firstApi] = apis;
  //         ^^^^^^^^^^ array binding pattern
  //   const { [apiKey]: myApi } = options;
  //           ^^^^^^^^ computed property name
  //   function f({ myApi }) { ... }
  //              ^^^^^^^^^ parameter, whose value depends on callers
  const bindingPattern = bindingElement.parent;
  const variableDeclaration = bindingPattern.parent;
  const propertyName = bindingElement.propertyName ?? bindingElement.name;
  if (
    !ts.isObjectBindingPattern(bindingPattern) ||
    bindingElement.dotDotDotToken ||
    !ts.isVariableDeclaration(variableDeclaration) ||
    !(ts.isIdentifier(propertyName) || ts.isStringLiteral(propertyName))
  ) {
    throw new UnresolvableExpressionError(
      bindingElement,
      'Cannot follow this kind of destructuring to a value',
    );
  }

  assertConstDeclaration(variableDeclaration);
  if (!variableDeclaration.initializer) {
    throw new UnresolvableExpressionError(
      variableDeclaration,
      'Cannot follow destructuring without an initializer',
    );
  }

  // EXAMPLES (source property name versus locally declared name):
  //   const { originalApi: myApi } = options;
  //           ^^^^^^^^^^^ propertyName
  //                        ^^^^^ name
  //   const { myApi } = options;
  //           ^^^^^ name (propertyName is absent, so use name)
  const sourceObjectLiterals = resolveGuaranteedObjectLiterals(
    variableDeclaration.initializer,
    context,
    stack,
  );
  const values = sourceObjectLiterals.flatMap((sourceObjectLiteral) =>
    collectPropertyValuesFromObject(
      sourceObjectLiteral,
      propertyName.text,
      context,
      stack,
    ),
  );

  if (values.length === 0) {
    throw new UnresolvableExpressionError(
      bindingElement,
      `Cannot find "${propertyName.text}" in the destructured object`,
    );
  }
  return values;
}

/**
 * Throws unless a variable is declared with `const`.
 *
 * @param variableDeclaration - The variable declaration to check.
 */
function assertConstDeclaration(
  variableDeclaration: ts.VariableDeclaration,
): void {
  // EXAMPLE:
  //   const api = { ... };
  //   ^^^^^ const flag
  //
  // ANTI-EXAMPLE:
  //   let api = {};
  //   ^^^ may be reassigned later
  const declarationList = variableDeclaration.parent;
  if (
    !ts.isVariableDeclarationList(declarationList) ||
    declarationList.getFirstToken()?.kind !== ts.SyntaxKind.ConstKeyword
  ) {
    throw new UnresolvableExpressionError(
      variableDeclaration,
      'Cannot follow a variable that is not declared with const, since it may be reassigned',
    );
  }
}

/**
 * Resolves a node unless it is already being resolved further up the stack.
 *
 * @param node - The node about to be resolved.
 * @param stack - The nodes currently being resolved.
 * @param resolve - Resolves the node.
 * @returns The result of `resolve`, or an empty array for a circular reference.
 */
function guardingAgainstCycles<Value>(
  node: ts.Node,
  stack: ResolutionStack,
  resolve: () => Value[],
): Value[] {
  if (stack.has(node)) {
    return [];
  }

  stack.add(node);
  try {
    return resolve();
  } finally {
    stack.delete(node);
  }
}
