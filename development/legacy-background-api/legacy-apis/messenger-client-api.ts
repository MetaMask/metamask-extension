import ts from 'typescript';
import { FunctionWithBody, getPropertyNameText } from './ast-utils';
import { UnresolvableExpressionError } from './errors';
import { ResolutionContext } from './module-resolution';
import {
  collectPropertyNamesFromObject,
  collectPropertyValuesFromObject,
  collectReturnExpressions,
  resolveFunctions,
  resolveGuaranteedObjectLiterals,
  resolveObjectLiterals,
} from './value-resolution';

/**
 * The name of the variable in `MetamaskController` that lists the init
 * functions of messenger clients.
 */
const MESSENGER_CLIENT_INIT_FUNCTIONS_VARIABLE_NAME =
  'messengerClientInitFunctions';

/**
 * Lists the method names in `MetamaskController.messengerClientApi`.
 *
 * `messengerClientApi` cannot be followed like other values, because it is
 * assembled at runtime: `initMessengerClients` loops over
 * `messengerClientInitFunctions`, calls each init function, and merges the
 * `api` objects they return. This function mirrors that process statically by
 * following each init function to the `api` objects it returns.
 *
 * @param metamaskControllerClass - The `MetamaskController` class declaration.
 * @param context - The resolution context.
 * @returns The names of the messenger client API methods.
 */
export function getMessengerClientApiMemberNames(
  metamaskControllerClass: ts.ClassDeclaration,
  context: ResolutionContext,
): Set<string> {
  // EXAMPLE:
  //   class MetamaskController {
  //     // ... somewhere ...
  //
  //     const messengerClientInitFunctions = {
  //       AppMetadataController: AppMetadataControllerInit,
  //       // ...
  //     };
  //   }

  const messengerClientInitFunctionsObject =
    findMessengerClientInitFunctionsObject(metamaskControllerClass);
  const names = new Set<string>();

  const messengerClientInitFunctionCandidates = collectAllPropertyValues(
    messengerClientInitFunctionsObject,
    context,
  );
  for (const messengerClientInitFunctionCandidate of messengerClientInitFunctionCandidates) {
    // All values in `messengerClientInitFunctions` *should* be functions,
    // but we call this just to be sure.
    const messengerClientInitFunctions = resolveFunctions(
      messengerClientInitFunctionCandidate,
      context,
    );
    for (const messengerClientInitFunction of messengerClientInitFunctions) {
      const apiPropertyNames = collectApiPropertyNamesFromMessengerClientInit(
        messengerClientInitFunction,
        context,
      );
      for (const name of apiPropertyNames) {
        names.add(name);
      }
    }
  }

  return names;
}

/**
 * Determines whether an expression reads `this.messengerClientApi`.
 *
 * @param expression - The expression to inspect.
 * @returns True if the expression is `this.messengerClientApi`.
 */
export function isMessengerClientApiAccess(expression: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
    getPropertyNameText(expression.name) === 'messengerClientApi'
  );
}

/**
 * Finds the object literal that lists the init functions of messenger clients.
 *
 * @param metamaskControllerClass - The `MetamaskController` class declaration.
 * @returns The object literal assigned to `messengerClientInitFunctions`.
 */
function findMessengerClientInitFunctionsObject(
  metamaskControllerClass: ts.ClassDeclaration,
): ts.ObjectLiteralExpression {
  const declarations: ts.VariableDeclaration[] = [];

  const visit = (node: ts.Node): void => {
    // EXAMPLE:
    //   const messengerClientInitFunctions = {
    //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ name
    //     AppMetadataController: AppMetadataControllerInit,
    //     // ...
    //   };
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === MESSENGER_CLIENT_INIT_FUNCTIONS_VARIABLE_NAME
    ) {
      declarations.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(metamaskControllerClass);

  if (declarations.length !== 1) {
    throw new Error(
      `MetamaskController must declare ${MESSENGER_CLIENT_INIT_FUNCTIONS_VARIABLE_NAME} exactly once`,
    );
  }

  const [declaration] = declarations;
  if (
    !declaration.initializer ||
    !ts.isObjectLiteralExpression(declaration.initializer)
  ) {
    throw new UnresolvableExpressionError(
      declaration,
      `${MESSENGER_CLIENT_INIT_FUNCTIONS_VARIABLE_NAME} must be initialized with an object literal`,
    );
  }
  return declaration.initializer;
}

/**
 * Collects the value of every property in an object literal, including the
 * properties contributed by its spreads.
 *
 * @param objectLiteral - The object literal to inspect.
 * @param context - The resolution context.
 * @returns The property values.
 */
function collectAllPropertyValues(
  objectLiteral: ts.ObjectLiteralExpression,
  context: ResolutionContext,
): ts.Expression[] {
  const values: ts.Expression[] = [];

  for (const objectElement of objectLiteral.properties) {
    // EXAMPLE:
    //   ...(getIsPerpsIncludedInBuild()
    //     ? { PerpsController: PerpsControllerInit }
    //     : {}),
    if (ts.isSpreadAssignment(objectElement)) {
      const spreadObjectLiterals = resolveGuaranteedObjectLiterals(
        objectElement.expression,
        context,
      );
      for (const spreadObjectLiteral of spreadObjectLiterals) {
        values.push(...collectAllPropertyValues(spreadObjectLiteral, context));
      }
      continue;
    }

    // EXAMPLE:
    //   AppMetadataController: AppMetadataControllerInit,
    //                          ^^^^^^^^^^^^^^^^^^^^^^^^^ initializer
    if (ts.isPropertyAssignment(objectElement)) {
      values.push(objectElement.initializer);
      continue;
    }

    // EXAMPLE:
    //   { PerpsControllerInit }
    //     ^^^^^^^^^^^^^^^^^^^ shorthand property assignment
    if (ts.isShorthandPropertyAssignment(objectElement)) {
      values.push(objectElement.name);
      continue;
    }

    throw new UnresolvableExpressionError(
      objectElement,
      `Cannot determine the init function for this ${MESSENGER_CLIENT_INIT_FUNCTIONS_VARIABLE_NAME} entry`,
    );
  }

  return values;
}

/**
 * Lists the names in the `api` objects that a messenger client init function
 * returns.
 *
 * An init function that does not return an `api` property contributes no
 * names, just as `initMessengerClients` treats a missing `api` as `{}`.
 *
 * @param messengerClientInitFunction - The init function to inspect.
 * @param context - The resolution context.
 * @returns The API names.
 */
function collectApiPropertyNamesFromMessengerClientInit(
  messengerClientInitFunction: FunctionWithBody,
  context: ResolutionContext,
): Set<string> {
  const names = new Set<string>();

  // EXAMPLE:
  //   return { messengerClient, api };
  //          ^^^^^^^^^^^^^^^^^^^^^^^^ return expression
  const returnExpressions = collectReturnExpressions(
    messengerClientInitFunction,
  );
  if (returnExpressions.length === 0) {
    const functionName = getFunctionName(messengerClientInitFunction);
    throw new UnresolvableExpressionError(
      messengerClientInitFunction,
      functionName === undefined
        ? 'This messenger client init function does not return a value'
        : `The messenger client init function "${functionName}" does not return a value`,
    );
  }

  for (const returnExpression of returnExpressions) {
    const resultObjectLiterals = resolveGuaranteedObjectLiterals(
      returnExpression,
      context,
    );
    for (const resultObjectLiteral of resultObjectLiterals) {
      // EXAMPLE:
      //   return { messengerClient, api };
      //                             ^^^ `api` property value
      const apiPropertyValues = collectPropertyValuesFromObject(
        resultObjectLiteral,
        'api',
        context,
      );
      for (const apiPropertyValue of apiPropertyValues) {
        for (const apiObjectLiteral of resolveObjectLiterals(
          apiPropertyValue,
          context,
        )) {
          const apiPropertyNames = collectPropertyNamesFromObject(
            apiObjectLiteral,
            context,
          );
          for (const name of apiPropertyNames) {
            names.add(name);
          }
        }
      }
    }
  }

  return names;
}

/**
 * Finds the name of a function, for use in error messages.
 *
 * @param functionWithBody - The function to name.
 * @returns The name of the function or of the variable it is assigned to, if
 * any.
 */
function getFunctionName(
  functionWithBody: FunctionWithBody,
): string | undefined {
  // EXAMPLE:
  //   function AlertControllerInit(request) { ... }
  //            ^^^^^^^^^^^^^^^^^^^ name
  if (functionWithBody.name && ts.isIdentifier(functionWithBody.name)) {
    return functionWithBody.name.text;
  }

  // EXAMPLE:
  //   const PerpsControllerInit = (request) => { ... };
  //         ^^^^^^^^^^^^^^^^^^^ name of the variable declaration (parent)
  const { parent } = functionWithBody;
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }

  return undefined;
}
