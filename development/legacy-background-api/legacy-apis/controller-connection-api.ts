import ts from 'typescript';
import { setSubtract } from '../set-utils';
import {
  getMessengerClientApiMemberNames,
  isMessengerClientApiAccess,
} from './messenger-client-api';
import { getPropertyNameText, unwrapExpression } from './ast-utils';
import { ResolutionContext } from './module-resolution';
import { resolvePropertyNamesFromObjectElement } from './value-resolution';

/**
 * The names of the properties exposed by the controller connection API object,
 * grouped by where they come from.
 */
export type ControllerConnectionApiMemberNames = {
  /**
   * Names contributed by `...this.messengerClientApi`.
   */
  messengerClientApiMethods: Set<string>;
  /**
   * Names contributed by `...this.getApi()` and not by `messengerClientApi`.
   */
  getApiMethods: Set<string>;
  /**
   * Names added directly in `setupControllerConnection`, through properties or
   * other spreads, and not contributed by `getApi` or `messengerClientApi`.
   */
  adhocControllerConnectionMethods: Set<string>;
};

/**
 * Extracts the names of the properties exposed by the controller connection
 * API object (see `MetamaskController.setupControllerConnection`), grouped by
 * where they come from.
 *
 * Spreads in the API object are followed to the objects they produce. If a
 * spread cannot be followed, this throws rather than silently omitting its
 * names, so that the snapshot never misses part of the API.
 *
 * @param sourceFile - The parsed file that defines `MetamaskController`.
 * @param context - The resolution context.
 * @returns The names of the API properties, grouped by source.
 */
export function getControllerConnectionApiMemberNames(
  sourceFile: ts.SourceFile,
  context: ResolutionContext,
): ControllerConnectionApiMemberNames {
  const metamaskControllerClass = findMetamaskController(sourceFile);
  const controllerConnectionApiObject = findControllerConnectionApiObject(
    metamaskControllerClass,
    sourceFile,
  );
  const messengerClientApiMethods = new Set<string>();
  const getApiMethods = new Set<string>();
  const nonGetApiMethods = new Set<string>();

  for (const objectElement of controllerConnectionApiObject.properties) {
    // `messengerClientApi` is assembled at runtime, so it is tracked by
    // following the messenger client init functions instead.
    //
    // EXAMPLE:
    //   const api = { ...this.messengerClientApi };
    //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^ spread assignment
    if (
      ts.isSpreadAssignment(objectElement) &&
      isMessengerClientApiAccess(objectElement.expression)
    ) {
      const messengerClientApiNames = getMessengerClientApiMemberNames(
        metamaskControllerClass,
        context,
      );
      for (const name of messengerClientApiNames) {
        messengerClientApiMethods.add(name);
      }
      continue;
    }

    const propertyNames = resolvePropertyNamesFromObjectElement(
      objectElement,
      context,
    );
    // EXAMPLE:
    //   const api = { ...this.getApi() };
    //                 ^^^^^^^^^^^^^^^^ spread assignment
    const namesForSource =
      ts.isSpreadAssignment(objectElement) &&
      isGetApiCall(objectElement.expression)
        ? getApiMethods
        : nonGetApiMethods;
    for (const name of propertyNames) {
      namesForSource.add(name);
    }
  }

  return {
    messengerClientApiMethods,
    // Make sure everything in getApiMethods is not also listed elsewhere
    getApiMethods: setSubtract(getApiMethods, messengerClientApiMethods),
    // Make sure everything in adhocControllerConnectionMethods is not also
    // listed elsewhere
    adhocControllerConnectionMethods: setSubtract(
      setSubtract(nonGetApiMethods, messengerClientApiMethods),
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
function findMetamaskController(
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
  if (!ts.isObjectLiteralExpression(apiVariable.initializer)) {
    throw new Error(
      'MetamaskController.setupControllerConnection api must be an object literal',
    );
  }
  return apiVariable.initializer;
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
