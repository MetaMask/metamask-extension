import ts from 'typescript';
import { setSubtract } from '../set-utils';
import {
  getPropertyNameText,
  isConstVariableDeclaration,
  unwrapExpression,
} from './ast-utils';
import { ResolutionContext } from './module-resolution';
import { resolvePropertyNamesFromObjectElement } from './value-resolution';

/**
 * The names of the properties exposed by the API object returned by
 * `MetamaskController.setupControllerConnection`, grouped by where they come
 * from.
 */
export type ControllerConnectionApiMemberNames = {
  /**
   * Names contributed by `...this.getApi()`.
   */
  getApiMethods: Set<string>;
  /**
   * Names added directly in `setupControllerConnection`, through properties or
   * other spreads, and not contributed by `getApi`.
   */
  adhocControllerConnectionMethods: Set<string>;
};

/**
 * Extracts the names of the properties exposed by the API object returned by
 * `MetamaskController.setupControllerConnection`, grouped by where they come
 * from (`MetamaskController.getApi`, or somewhere else).
 *
 * @param sourceFile - The parsed file that defines `MetamaskController`.
 * @param context - The resolution context.
 * @returns The names of the API properties, grouped by source.
 */
export function getControllerConnectionApiMemberNames(
  sourceFile: ts.SourceFile,
  context: ResolutionContext,
): ControllerConnectionApiMemberNames {
  // EXAMPLE:
  //   class MetamaskController {
  //     setupControllerConnection() {
  //       const api = {
  //             ^^^
  //         ...this.getApi(),
  //         ...this.messengerClientApi,
  //       };
  //     }
  //   }
  const metamaskControllerClass = findMetamaskControllerClass(sourceFile);
  const controllerConnectionApiObject = findControllerConnectionApiObject(
    metamaskControllerClass,
    sourceFile,
  );

  const getApiMethods = new Set<string>();
  const nonGetApiMethods = new Set<string>();

  for (const objectElement of controllerConnectionApiObject.properties) {
    // `messengerClientApi` is assembled at runtime from the `api` objects that
    // messenger client init functions return, so it cannot be followed like
    // other values. It is not tracked yet.
    //
    // EXAMPLE:
    //   const api = { ...this.messengerClientApi };
    //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^ spread assignment
    if (
      ts.isSpreadAssignment(objectElement) &&
      isMessengerClientApiAccess(objectElement.expression)
    ) {
      continue;
    }

    let namesToCapture;
    if (
      ts.isSpreadAssignment(objectElement) &&
      isGetApiCall(objectElement.expression)
    ) {
      // EXAMPLE:
      //   const api = { ...this.getApi() };
      namesToCapture = getApiMethods;
    } else {
      // EXAMPLE:
      //   const api = { ...getTransactionControllerApi(this.txController) };
      namesToCapture = nonGetApiMethods;
    }

    const propertyNames = resolvePropertyNamesFromObjectElement(
      objectElement,
      context,
    );
    for (const name of propertyNames) {
      namesToCapture.add(name);
    }
  }

  return {
    getApiMethods,
    // Make sure everything in adhocControllerConnectionMethods is not also
    // listed elsewhere
    adhocControllerConnectionMethods: setSubtract(
      nonGetApiMethods,
      getApiMethods,
    ),
  };
}

/**
 * Finds the `MetamaskController` class declaration.
 *
 * @param sourceFile - The parsed file that defines `MetamaskController`.
 * @returns The class declaration.
 */
function findMetamaskControllerClass(
  sourceFile: ts.SourceFile,
): ts.ClassDeclaration {
  // EXAMPLE:
  //   class MetamaskController { ... }
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  const metamaskControllerClass = sourceFile.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) &&
      statement.name?.text === 'MetamaskController',
  );
  if (!metamaskControllerClass) {
    throw new Error('MetamaskController was not found');
  }
  return metamaskControllerClass;
}

/**
 * Finds the object literal assigned to `api` in `setupControllerConnection`.
 *
 * @param metamaskControllerClass - The `MetamaskController` class declaration.
 * @param sourceFile - The parsed file that defines `MetamaskController`.
 * @returns The API object literal.
 */
function findControllerConnectionApiObject(
  metamaskControllerClass: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): ts.ObjectLiteralExpression {
  // EXAMPLE:
  //   class MetamaskController {
  //     setupControllerConnection() { ... }
  //   }
  const method = metamaskControllerClass.members.find(
    (member): member is ts.MethodDeclaration =>
      ts.isMethodDeclaration(member) &&
      member.name.getText(sourceFile) === 'setupControllerConnection',
  );
  if (!method?.body) {
    throw new Error(
      'MetamaskController.setupControllerConnection was not found',
    );
  }

  // EXAMPLE:
  //   class MetamaskController {
  //     setupControllerConnection() {
  //       const api = {
  //             ^^^
  //         ...this.getApi(),
  //         ...this.messengerClientApi,
  //       };
  //     }
  //   }
  const apiVariable = method.body.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => statement.declarationList.declarations)
    .find((declaration) => declaration.name.getText(sourceFile) === 'api');
  if (!apiVariable?.initializer) {
    throw new Error(
      'MetamaskController.setupControllerConnection did not define api',
    );
  }
  if (!isConstVariableDeclaration(apiVariable)) {
    throw new Error(
      'MetamaskController.setupControllerConnection api must be declared with const',
    );
  }

  const apiObject = unwrapExpression(apiVariable.initializer);
  if (!ts.isObjectLiteralExpression(apiObject)) {
    throw new Error(
      'MetamaskController.setupControllerConnection api must be an object literal',
    );
  }
  return apiObject;
}

/**
 * Determines whether an expression reads `this.messengerClientApi`.
 *
 * @param expression - The expression to inspect.
 * @returns True if the expression is `this.messengerClientApi`.
 */
function isMessengerClientApiAccess(expression: ts.Expression): boolean {
  const normalizedExpression = unwrapExpression(expression);

  return (
    ts.isPropertyAccessExpression(normalizedExpression) &&
    normalizedExpression.expression.kind === ts.SyntaxKind.ThisKeyword &&
    getPropertyNameText(normalizedExpression.name) === 'messengerClientApi'
  );
}

/**
 * Determines whether an expression calls `this.getApi()`.
 *
 * @param expression - The expression to inspect.
 * @returns True if the expression is `this.getApi()`.
 */
function isGetApiCall(expression: ts.Expression): boolean {
  const normalizedExpression = unwrapExpression(expression);

  return (
    ts.isCallExpression(normalizedExpression) &&
    ts.isPropertyAccessExpression(normalizedExpression.expression) &&
    normalizedExpression.expression.expression.kind ===
      ts.SyntaxKind.ThisKeyword &&
    getPropertyNameText(normalizedExpression.expression.name) === 'getApi'
  );
}
