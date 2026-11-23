import ts from 'typescript';
import {
  getPropertyNameText,
  isConstVariableDeclaration,
  unwrapExpression,
} from './ast-utils';
import { getMessengerClientApiMemberNames } from './messenger-client-api';
import { ResolutionContext } from './module-resolution';
import { resolvePropertyNamesFromObjectElement } from './value-resolution';

/**
 * The names of the properties exposed by the API object returned by
 * `MetamaskController.setupControllerConnection`, grouped by where they come
 * from.
 */
export type ControllerConnectionApiMemberNames = {
  /**
   * Names whose final value comes from `...this.messengerClientApi`.
   */
  messengerClientApiMethods: Set<string>;
  /**
   * Names whose final value comes from `...this.getApi()`.
   */
  getApiMethods: Set<string>;
  /**
   * Names whose final value is added directly in `setupControllerConnection`,
   * through properties or other spreads.
   */
  adhocControllerConnectionMethods: Set<string>;
};

/**
 * Extracts the names of the properties exposed by the API object returned by
 * `MetamaskController.setupControllerConnection`, grouped by where they come
 * from (the in-client init system, `MetamaskController.getApi`, or somewhere
 * else).
 *
 * When several elements of the object define the same name, the last one
 * wins, just as it does at runtime, so the name is listed under the group of
 * that element only. For example, the Perps stream bridge is spread in after
 * `messengerClientApi` and replaces some of its methods.
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

  const groupsByName = new Map<
    string,
    keyof ControllerConnectionApiMemberNames
  >();

  for (const objectElement of controllerConnectionApiObject.properties) {
    const group = getGroupOfObjectElement(objectElement);
    const propertyNames =
      // `messengerClientApi` is assembled at runtime, so its names are found by
      // following the messenger client init functions instead.
      group === 'messengerClientApiMethods'
        ? getMessengerClientApiMemberNames(metamaskControllerClass, context)
        : resolvePropertyNamesFromObjectElement(objectElement, context);
    for (const name of propertyNames) {
      groupsByName.set(name, group);
    }
  }

  const memberNames: ControllerConnectionApiMemberNames = {
    messengerClientApiMethods: new Set(),
    getApiMethods: new Set(),
    adhocControllerConnectionMethods: new Set(),
  };
  for (const [name, group] of groupsByName) {
    memberNames[group].add(name);
  }
  return memberNames;
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

/**
 * Determines which group the names contributed by one element of the
 * controller connection API object belong to.
 *
 * @param objectElement - The element of the API object.
 * @returns The group of the element's names.
 */
function getGroupOfObjectElement(
  objectElement: ts.ObjectLiteralElementLike,
): keyof ControllerConnectionApiMemberNames {
  if (!ts.isSpreadAssignment(objectElement)) {
    // EXAMPLE:
    //   const api = { startSendingPatches: () => { ... } };
    //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ property assignment
    return 'adhocControllerConnectionMethods';
  }

  // EXAMPLE:
  //   const api = { ...this.messengerClientApi };
  //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^ spread assignment
  if (isMessengerClientApiAccess(objectElement.expression)) {
    return 'messengerClientApiMethods';
  }

  // EXAMPLE:
  //   const api = { ...this.getApi() };
  //                 ^^^^^^^^^^^^^^^^ spread assignment
  if (isGetApiCall(objectElement.expression)) {
    return 'getApiMethods';
  }

  // EXAMPLE:
  //   const api = { ...getTransactionControllerApi(this.txController) };
  //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ spread assignment
  return 'adhocControllerConnectionMethods';
}
