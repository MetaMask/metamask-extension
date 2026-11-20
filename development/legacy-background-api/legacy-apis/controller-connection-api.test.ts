import * as path from 'node:path';
import ts from 'typescript';
import { getControllerConnectionApiMemberNames } from './controller-connection-api';
import { ResolutionContext } from './module-resolution';

describe('getControllerConnectionApiMemberNames', () => {
  describe('finding the API object', () => {
    it('rejects a missing controller', () => {
      const { sourceFile, context } = parseSource('class OtherController {}');

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('MetamaskController was not found');
    });

    it('rejects a missing connection method', () => {
      const { sourceFile, context } = parseSource(
        'class MetamaskController {}',
      );

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('MetamaskController.setupControllerConnection was not found');
    });

    it('rejects a connection method without a body', () => {
      const { sourceFile, context } = parseSource(
        'declare class MetamaskController { setupControllerConnection(): void; }',
      );

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('MetamaskController.setupControllerConnection was not found');
    });

    it('rejects a missing api', () => {
      const { sourceFile, context } = parseSource(
        'class MetamaskController { setupControllerConnection() { const other = {}; } }',
      );

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'MetamaskController.setupControllerConnection did not define api',
      );
    });

    it('rejects an uninitialized api', () => {
      const { sourceFile, context } = parseSource(
        'class MetamaskController { setupControllerConnection() { let api; } }',
      );

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'MetamaskController.setupControllerConnection did not define api',
      );
    });

    it('rejects an api that may be reassigned', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          let api = {};
          api = { exposed() {} };
        }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'MetamaskController.setupControllerConnection api must be declared with const',
      );
    });

    it('finds an api wrapped in parentheses and type assertions', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = ({ exposed() {} } as Api);
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('rejects a non-object api', () => {
      const { sourceFile, context } = parseSource(
        'class MetamaskController { setupControllerConnection() { const api = createApi(); } }',
      );

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'MetamaskController.setupControllerConnection api must be an object literal',
      );
    });

    it('rejects a nested api declaration', () => {
      const { sourceFile, context } = parseSource(
        'class MetamaskController { setupControllerConnection() { function nested() { const api = {}; } } }',
      );

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'MetamaskController.setupControllerConnection did not define api',
      );
    });

    it('finds api after other statements and declarations', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          initialize();
          const other = {};
          const first = {}, api = { exposed() {} };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });
  });

  describe('grouping by source', () => {
    it('groups names from getApi and the api object itself', () => {
      const { sourceFile, context } = parseSource(`
        function getTransactionControllerApi() {
          return { abortTransactionSigning() {} };
        }
        class MetamaskController {
          getApi() { return { setLocked() {} }; }
          setupControllerConnection() {
            const api = {
              ...this.getApi(),
              ...getTransactionControllerApi(),
              startSendingPatches: () => {},
            };
          }
        }`);

      const names = getControllerConnectionApiMemberNames(sourceFile, context);

      expect(names).toStrictEqual({
        getApiMethods: new Set(['setLocked']),
        adhocControllerConnectionMethods: new Set([
          'abortTransactionSigning',
          'startSendingPatches',
        ]),
      });
    });

    it('recognizes a getApi call wrapped in parentheses', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        getApi() { return { setLocked() {} }; }
        setupControllerConnection() { const api = { ...(this.getApi()) }; }
      }`);

      const { getApiMethods } = getControllerConnectionApiMemberNames(
        sourceFile,
        context,
      );

      expect(getApiMethods).toStrictEqual(new Set(['setLocked']));
    });

    it('treats a getApi call on another object as ad hoc', () => {
      const { sourceFile, context } = parseSource(`
        class Bridge { getApi() { return { fromBridge() {} }; } }
        const bridge = new Bridge();
        class MetamaskController {
          getApi() { return { fromController() {} }; }
          setupControllerConnection() { const api = { ...bridge.getApi() }; }
        }`);

      const names = getControllerConnectionApiMemberNames(sourceFile, context);

      expect(names).toStrictEqual({
        getApiMethods: new Set(),
        adhocControllerConnectionMethods: new Set(['fromBridge']),
      });
    });

    it('lists an ad hoc name only under getApi when getApi also contributes it', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        getApi() { return { shared() {} }; }
        setupControllerConnection() {
          const api = { ...this.getApi(), shared: () => {}, startSendingPatches: () => {} };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['startSendingPatches']),
      );
    });
  });

  describe('properties', () => {
    it('collects top-level property names without inspecting their values', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = {
            method() {},
            get getter() { return () => {}; },
            arrow: () => ({ notAnApiMember() {} }),
            nested: { alsoNotAnApiMember() {} },
            alias: original,
            shorthand,
            'quoted': () => {},
            1: () => {},
          };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set([
          'method',
          'getter',
          'arrow',
          'nested',
          'alias',
          'shorthand',
          'quoted',
          '1',
        ]),
      );
    });

    it('collects computed property names written as literals', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { ['quoted']: () => {}, [1]: () => {} };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['quoted', '1']),
      );
    });

    it('rejects a computed property name that is not a literal', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { [DYNAMIC_KEY]: () => {} };
        }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot determine the name of this property');
    });
  });

  describe('spreads of values', () => {
    it('follows a spread of an object literal', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...{ exposed() {} } }; }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('follows a spread of a const variable', () => {
      const { sourceFile, context } = parseSource(`
        const sharedApi = { exposed() {} };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('rejects a spread of a variable that may be reassigned', () => {
      const { sourceFile, context } = parseSource(`
        let sharedApi = { exposed() {} };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot follow a variable that is not declared with const');
    });

    it('follows a spread through parentheses and type assertions', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { ...(({ exposed() {} } as Api)!) };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('collects both branches of a conditional spread', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { ...(enabled ? { first() {} } : { second() {} }) };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['first', 'second']),
      );
    });

    it('allows a conditional spread with a null branch', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { ...(enabled ? { exposed() {} } : null) };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('rejects a spread of a method reference', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        getApi() { return { exposed() {} }; }
        setupControllerConnection() { const api = { ...this.getApi }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot determine which object this expression produces');
    });

    it('rejects a spread of a function value', () => {
      const { sourceFile, context } = parseSource(`
        function createApi() { return { exposed() {} }; }
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot follow this kind of definition to a value');
    });

    it('rejects a spread of an undefined name', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...unknownApi }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot find a definition for "unknownApi"');
    });

    it('rejects a spread of a property', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...this.missing }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot determine which object this expression produces');
    });

    it('rejects a spread of an unsupported expression', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...42 }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot determine which object this expression produces');
    });

    it('rejects spreads that refer to each other', () => {
      const { sourceFile, context } = parseSource(`
        const firstApi = { ...secondApi };
        const secondApi = { ...firstApi };
        class MetamaskController {
          setupControllerConnection() { const api = { ...firstApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('This expression refers back to itself');
    });
  });

  describe('spreads of call results', () => {
    it('follows a call to a function declaration', () => {
      const { sourceFile, context } = parseSource(`
        function createApi() { return { exposed() {} }; }
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('follows a call to an arrow function', () => {
      const { sourceFile, context } = parseSource(`
        const createApi = () => ({ exposed() {} });
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('follows a call to a function expression', () => {
      const { sourceFile, context } = parseSource(`
        const createApi = function () { return { exposed() {} }; };
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('follows an immediately invoked function', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { ...(() => ({ exposed() {} }))() };
        }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('collects returns inside conditional blocks but not inside nested functions', () => {
      const { sourceFile, context } = parseSource(`
        function createApi() {
          function nested() { return { hidden() {} }; }
          if (enabled) {
            return { early() {} };
          }
          return { late() {} };
        }
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['early', 'late']),
      );
    });

    it('follows a call to a method on this', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        createApi() { return { exposed() {} }; }
        setupControllerConnection() { const api = { ...this.createApi() }; }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('ignores computed class members when looking up a method', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        [Symbol.iterator]() {}
        getApi() { return { exposed() {} }; }
        setupControllerConnection() { const api = { ...this.getApi() }; }
      }`);

      const { getApiMethods } = getControllerConnectionApiMemberNames(
        sourceFile,
        context,
      );

      expect(getApiMethods).toStrictEqual(new Set(['exposed']));
    });

    it('follows an overloaded function to its implementation', () => {
      const { sourceFile, context } = parseSource(`
        function createApi(): Api;
        function createApi(enabled: boolean): Api;
        function createApi(enabled?: boolean) { return { exposed() {} }; }
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('rejects a function declared without an implementation', () => {
      const { sourceFile, context } = parseSource(`
        declare function createApi(): Api;
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot find an implementation of "createApi"');
    });

    it('rejects a recursive helper', () => {
      const { sourceFile, context } = parseSource(`
        function createApi(depth) {
          return depth > 0 ? createApi(depth - 1) : { exposed() {} };
        }
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi(2) }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('This expression refers back to itself');
    });

    it('rejects functions that refer to each other', () => {
      const { sourceFile, context } = parseSource(`
        const createFirstApi = createSecondApi;
        const createSecondApi = createFirstApi;
        class MetamaskController {
          setupControllerConnection() { const api = { ...createFirstApi() }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('This expression refers back to itself');
    });

    it('rejects receivers that refer to each other', () => {
      const { sourceFile, context } = parseSource(`
        const firstBridge = secondBridge;
        const secondBridge = firstBridge;
        class MetamaskController {
          setupControllerConnection() {
            const api = { ...firstBridge.bridgeApi() };
          }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('This expression refers back to itself');
    });

    it('follows a call to a method on an instance', () => {
      const { sourceFile, context } = parseSource(`
        class Bridge { bridgeApi() { return { exposed() {} }; } }
        const bridge = new Bridge();
        class MetamaskController {
          setupControllerConnection() { const api = { ...bridge.bridgeApi() }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('follows a receiver created conditionally, as with the Perps stream bridge', () => {
      const { sourceFile, context } = parseSource(`
        class PerpsStreamBridge { bridgeApi() { return { perpsInit() {} }; } }
        class MetamaskController {
          setupControllerConnection() {
            const perpsStream = perpsController
              ? new PerpsStreamBridge({ controller: perpsController })
              : null;
            const api = {
              ...(perpsStream ? perpsStream.bridgeApi() : {}),
            };
          }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['perpsInit']),
      );
    });

    it('rejects a call to an undefined function', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...unknownFactory() }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot find a definition for "unknownFactory"');
    });

    it('rejects a call to a missing method', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...this.missing() }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'Cannot find a method named "missing" on the receiver\'s class',
      );
    });

    it('rejects a call to a function that returns nothing', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        getApi() { initialize(); }
        setupControllerConnection() { const api = { ...this.getApi() }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('This expression does not resolve to any object');
    });

    it('rejects a receiver whose class cannot be determined', () => {
      const { sourceFile, context } = parseSource(`
        const bridge = createBridge;
        class MetamaskController {
          setupControllerConnection() { const api = { ...bridge.bridgeApi() }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot find a definition for "createBridge"');
    });
  });

  describe('name lookup', () => {
    it('rejects a spread of a function parameter', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection(sharedApi) { const api = { ...sharedApi }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot follow this kind of definition to a value');
    });

    it('follows an imported function', () => {
      const { sourceFile, context } = parseSource(`
        import { createApi } from './factory';
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);
      addSource(
        context,
        'factory.ts',
        'export function createApi() { return { imported() {} }; }',
      );

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['imported']),
      );
    });

    it('resolves names inside an imported file within that file', () => {
      const { sourceFile, context } = parseSource(`
        import { createApi } from './factory';
        const sharedApi = { fromController() {} };
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);
      addSource(
        context,
        'factory.ts',
        `const sharedApi = { fromFactory() {} };
        export function createApi() { return sharedApi; }`,
      );

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['fromFactory']),
      );
    });
  });

  describe('destructuring', () => {
    it('rejects a spread of a destructured name', () => {
      const { sourceFile, context } = parseSource(`
        const { sharedApi } = { sharedApi: { exposedMethod() {} } };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot follow this kind of definition to a value');
    });
  });

  describe('messengerClientApi', () => {
    it('ignores the messengerClientApi spread', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        getApi() { return { setLocked() {} }; }
        setupControllerConnection() {
          const api = { ...this.getApi(), ...this.messengerClientApi };
        }
      }`);

      const names = getControllerConnectionApiMemberNames(sourceFile, context);

      expect(names).toStrictEqual({
        getApiMethods: new Set(['setLocked']),
        adhocControllerConnectionMethods: new Set(),
      });
    });

    it('ignores a messengerClientApi spread wrapped in parentheses', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { ...(this.messengerClientApi) };
        }
      }`);

      const names = getControllerConnectionApiMemberNames(sourceFile, context);

      expect(names).toStrictEqual({
        getApiMethods: new Set(),
        adhocControllerConnectionMethods: new Set(),
      });
    });
  });
});

/**
 * Parses a controller fixture with the cache required by the real resolver.
 *
 * @param source - The complete source of the controller fixture.
 * @returns The parsed source and its resolution context.
 */
function parseSource(source: string) {
  const context = {
    sourceFilesByPath: new Map<string, ts.SourceFile>(),
    nodesBeingResolved: new Set<ts.Node>(),
  } satisfies ResolutionContext;
  const sourceFile = addSource(context, 'controller.ts', source);

  return { sourceFile, context };
}

/**
 * Adds a parsed file to a resolution context, so that it can be imported
 * without being read from disk.
 *
 * @param context - The resolution context.
 * @param fileName - The file name, relative to the working directory.
 * @param source - The source of the file.
 * @returns The parsed source file.
 */
function addSource(
  context: ResolutionContext,
  fileName: string,
  source: string,
): ts.SourceFile {
  const filePath = path.resolve(fileName);
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  context.sourceFilesByPath.set(filePath, sourceFile);
  return sourceFile;
}
