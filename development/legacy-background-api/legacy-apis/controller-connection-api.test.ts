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
    it('groups names from messengerClientApi, getApi, and the api object itself', () => {
      const { sourceFile, context } = parseSource(`
        const PerpsControllerInit = () => ({
          messengerClient: {},
          api: { perpsPlaceOrder() {} },
        });
        function getTransactionControllerApi() {
          return { abortTransactionSigning() {} };
        }
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              PerpsController: PerpsControllerInit,
            };
          }
          getApi() { return { setLocked() {} }; }
          setupControllerConnection() {
            const api = {
              ...this.getApi(),
              ...this.messengerClientApi,
              ...getTransactionControllerApi(),
              startSendingPatches: () => {},
            };
          }
        }`);

      const names = getControllerConnectionApiMemberNames(sourceFile, context);

      expect(names).toStrictEqual({
        messengerClientApiMethods: new Set(['perpsPlaceOrder']),
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
        messengerClientApiMethods: new Set(),
        getApiMethods: new Set(),
        adhocControllerConnectionMethods: new Set(['fromBridge']),
      });
    });

    it('lists a name from getApi only under messengerClientApi when both contribute it', () => {
      const { sourceFile, context } = parseSource(`
        const RampsControllerInit = () => ({
          messengerClient: {},
          api: { shared() {} },
        });
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              RampsController: RampsControllerInit,
            };
          }
          getApi() { return { shared() {}, setLocked() {} }; }
          setupControllerConnection() {
            const api = { ...this.getApi(), ...this.messengerClientApi };
          }
        }`);

      const { getApiMethods } = getControllerConnectionApiMemberNames(
        sourceFile,
        context,
      );

      expect(getApiMethods).toStrictEqual(new Set(['setLocked']));
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

    it('lists an ad hoc name only under messengerClientApi when messengerClientApi also contributes it', () => {
      const { sourceFile, context } = parseSource(`
        const RampsControllerInit = () => ({
          messengerClient: {},
          api: { shared() {} },
        });
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              RampsController: RampsControllerInit,
            };
          }
          setupControllerConnection() {
            const api = {
              ...this.messengerClientApi,
              shared: () => {},
              startSendingPatches: () => {},
            };
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

    it('follows a spread of a class field on this', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        sharedApi = { exposed() {} };
        setupControllerConnection() { const api = { ...this.sharedApi }; }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('follows a spread of a property assigned in the constructor', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        constructor() {
          this.other = {};
          if (enabled) {
            this.sharedApi = { exposed() {} };
          }
        }
        setupControllerConnection() { const api = { ...this.sharedApi }; }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('prefers a class field initializer over a constructor assignment', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        constructor() { this.sharedApi = { fromConstructor() {} }; }
        sharedApi = { fromField() {} };
        setupControllerConnection() { const api = { ...this.sharedApi }; }
      }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['fromField']),
      );
    });

    it('follows a spread of a getter on an instance', () => {
      const { sourceFile, context } = parseSource(`
        class Bridge { get api() { return { exposed() {} }; } }
        const bridge = new Bridge();
        class MetamaskController {
          setupControllerConnection() { const api = { ...bridge.api }; }
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
      ).toThrow('"getApi" is a method; call it to use the object it returns');
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

    it('rejects a spread of a missing property', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...this.missing }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot find a value for "missing" on the receiver\'s class');
    });

    it('rejects a spread of a field that is never assigned', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        missing: unknown;
        setupControllerConnection() { const api = { ...this.missing }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot find a value for "missing" on the receiver\'s class');
    });

    it('rejects a spread of an unsupported expression', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() { const api = { ...42 }; }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot determine which object this expression produces');
    });

    it('rejects a spread that refers to itself', () => {
      const { sourceFile, context } = parseSource(`
        const sharedApi = { exposed() {}, ...sharedApi };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('This expression does not resolve to any object');
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

    it('follows a call to an arrow-function field on an instance', () => {
      const { sourceFile, context } = parseSource(`
        class Bridge { bridgeApi = () => ({ exposed() {} }); }
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

    it('follows a receiver stored in a field, not the class that holds it', () => {
      const { sourceFile, context } = parseSource(`
        class Bridge { bridgeApi() { return { fromBridge() {} }; } }
        class MetamaskController {
          bridge = new Bridge();
          bridgeApi() { return { fromController() {} }; }
          setupControllerConnection() {
            const api = { ...this.bridge.bridgeApi() };
          }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['fromBridge']),
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

    it('rejects circular aliases of a receiver without overflowing the stack', () => {
      const { sourceFile, context } = parseSource(`
        const first = second;
        const second = first;
        class MetamaskController {
          setupControllerConnection() { const api = { ...first.bridgeApi() }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'Cannot determine which class this expression is an instance of',
      );
    });
  });

  describe('name lookup', () => {
    it('uses the innermost declaration of a shadowed name', () => {
      const { sourceFile, context } = parseSource(`
        const sharedApi = { outer() {} };
        class MetamaskController {
          setupControllerConnection() {
            const sharedApi = { inner() {} };
            const api = { ...sharedApi };
          }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['inner']),
      );
    });

    it('ignores declarations in unrelated scopes', () => {
      const { sourceFile, context } = parseSource(`
        function elsewhere() { const sharedApi = { unrelated() {} }; }
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

    it('follows a renamed import using the exported name', () => {
      const { sourceFile, context } = parseSource(`
        import { createApi as createSharedApi } from './factory';
        class MetamaskController {
          setupControllerConnection() { const api = { ...createSharedApi() }; }
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

    it('follows an import through a barrel file', () => {
      const { sourceFile, context } = parseSource(`
        import { createApi } from './factories';
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);
      addSource(
        context,
        'factories/index.ts',
        "export { createApi } from './create-api';",
      );
      addSource(
        context,
        'factories/create-api.ts',
        'export function createApi() { return { imported() {} }; }',
      );

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['imported']),
      );
    });

    it('follows an import through a wildcard re-export', () => {
      const { sourceFile, context } = parseSource(`
        import { createApi } from './factories';
        class MetamaskController {
          setupControllerConnection() { const api = { ...createApi() }; }
        }`);
      addSource(context, 'factories/index.ts', "export * from './create-api';");
      addSource(
        context,
        'factories/create-api.ts',
        'export function createApi() { return { imported() {} }; }',
      );

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['imported']),
      );
    });
  });

  describe('destructuring', () => {
    it('selects the destructured property from an object literal', () => {
      const { sourceFile, context } = parseSource(`
        const { sharedApi } = {
          sharedApi: { exposedMethod() {} },
          unrelated: true,
        };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposedMethod']),
      );
    });

    it('uses the original property name for a renamed binding', () => {
      const { sourceFile, context } = parseSource(`
        const options = { originalApi: { renamedMethod() {} }, unrelated: true };
        const { originalApi: sharedApi } = options;
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['renamedMethod']),
      );
    });

    it('follows a shorthand property in the destructured object', () => {
      const { sourceFile, context } = parseSource(`
        const originalApi = { exposedMethod() {} };
        const { originalApi: sharedApi } = { originalApi, unrelated: true };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposedMethod']),
      );
    });

    it('selects the destructured property from a function result', () => {
      const { sourceFile, context } = parseSource(`
        function createApis() { return { sharedApi: { exposed() {} }, other: {} }; }
        const { sharedApi } = createApis();
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      const { adhocControllerConnectionMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set(['exposed']),
      );
    });

    it('rejects a destructured property that does not exist', () => {
      const { sourceFile, context } = parseSource(`
        const { sharedApi } = { unrelated() {} };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot find "sharedApi" in the destructured object');
    });

    it('rejects an object rest binding', () => {
      const { sourceFile, context } = parseSource(`
        const { ...sharedApi } = { unrelated() {} };
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot follow this kind of destructuring to a value');
    });

    it('rejects an array binding', () => {
      const { sourceFile, context } = parseSource(`
        const [sharedApi] = [{ unrelated() {} }];
        class MetamaskController {
          setupControllerConnection() { const api = { ...sharedApi }; }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('Cannot follow this kind of destructuring to a value');
    });
  });

  describe('messengerClientApi', () => {
    it('collects the api objects returned by messenger client init functions', () => {
      const { sourceFile, context } = parseSource(`
        function getPerpsApi() { return { perpsInit() {} }; }
        const PerpsControllerInit = () => {
          const api = getPerpsApi();
          return { messengerClient: {}, api };
        };
        const RampsControllerInit = () => ({
          messengerClient: {},
          api: { startRampsLifecycle() {} },
        });
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              PerpsController: PerpsControllerInit,
              RampsController: RampsControllerInit,
            };
          }
          setupControllerConnection() {
            const api = { ...this.messengerClientApi };
          }
        }`);

      const { messengerClientApiMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(messengerClientApiMethods).toStrictEqual(
        new Set(['perpsInit', 'startRampsLifecycle']),
      );
    });

    it('ignores init functions that do not return an api', () => {
      const { sourceFile, context } = parseSource(`
        const AlertControllerInit = () => ({ messengerClient: {} });
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              AlertController: AlertControllerInit,
            };
          }
          setupControllerConnection() {
            const api = { ...this.messengerClientApi };
          }
        }`);

      const { messengerClientApiMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(messengerClientApiMethods).toStrictEqual(new Set());
    });

    it('follows init functions included through a conditional spread', () => {
      const { sourceFile, context } = parseSource(`
        const PerpsControllerInit = () => ({
          messengerClient: {},
          api: { perpsInit() {} },
        });
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              ...(isPerpsIncluded()
                ? { PerpsController: PerpsControllerInit }
                : {}),
            };
          }
          setupControllerConnection() {
            const api = { ...this.messengerClientApi };
          }
        }`);

      const { messengerClientApiMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(messengerClientApiMethods).toStrictEqual(new Set(['perpsInit']));
    });

    it('follows imported init functions', () => {
      const { sourceFile, context } = parseSource(`
        import { PerpsControllerInit } from './perps-controller-init';
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              PerpsController: PerpsControllerInit,
            };
          }
          setupControllerConnection() {
            const api = { ...this.messengerClientApi };
          }
        }`);
      addSource(
        context,
        'perps-controller-init.ts',
        `function getApi() { return { perpsInit() {} }; }
        export const PerpsControllerInit = () => {
          const api = getApi();
          return { messengerClient: {}, api };
        };`,
      );

      const { messengerClientApiMethods } =
        getControllerConnectionApiMemberNames(sourceFile, context);

      expect(messengerClientApiMethods).toStrictEqual(new Set(['perpsInit']));
    });

    it('rejects a controller without messengerClientInitFunctions', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        setupControllerConnection() {
          const api = { ...this.messengerClientApi };
        }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'MetamaskController must declare messengerClientInitFunctions exactly once',
      );
    });

    it('names an init function declaration that does not return a value', () => {
      const { sourceFile, context } = parseSource(`
        function AlertControllerInit() { initialize(); }
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              AlertController: AlertControllerInit,
            };
          }
          setupControllerConnection() {
            const api = { ...this.messengerClientApi };
          }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'The messenger client init function "AlertControllerInit" does not return a value',
      );
    });

    it('names an init function assigned to a variable that does not return a value', () => {
      const { sourceFile, context } = parseSource(`
        const AlertControllerInit = () => { initialize(); };
        class MetamaskController {
          constructor() {
            const messengerClientInitFunctions = {
              AlertController: AlertControllerInit,
            };
          }
          setupControllerConnection() {
            const api = { ...this.messengerClientApi };
          }
        }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow(
        'The messenger client init function "AlertControllerInit" does not return a value',
      );
    });

    it('rejects an anonymous init function that does not return a value', () => {
      const { sourceFile, context } = parseSource(`class MetamaskController {
        constructor() {
          const messengerClientInitFunctions = {
            AlertController: () => { initialize(); },
          };
        }
        setupControllerConnection() {
          const api = { ...this.messengerClientApi };
        }
      }`);

      expect(() =>
        getControllerConnectionApiMemberNames(sourceFile, context),
      ).toThrow('This messenger client init function does not return a value');
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
