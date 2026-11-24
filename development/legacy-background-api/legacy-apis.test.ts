import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  LEGACY_BACKGROUND_API_SERVICE_FILE_PATH,
  METAMASK_CONTROLLER_FILE_PATH,
  readApiMemberNames,
} from './legacy-apis';

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  readFileSync: jest.fn(),
}));

const mockReadFileSync = jest.mocked(readFileSync);

describe('readApiMemberNames', () => {
  beforeEach(() => {
    mockReadFileSync.mockClear();
  });

  describe('messengerClientApiMethods', () => {
    it('reads methods from the api objects returned by messenger client init functions', () => {
      mockSourceFiles({
        controllerSource: `const PerpsControllerInit = () => ({ messengerClient: {}, api: { perpsPlaceOrder() {} } });

class MetamaskController {
  constructor() {
    const messengerClientInitFunctions = { PerpsController: PerpsControllerInit };
  }

  getApi() {
    return { setLocked() {} };
  }

  setupControllerConnection() {
    const api = {
      ...this.getApi(),
      ...this.messengerClientApi,
      startSendingPatches: () => {},
    };
  }
}`,
      });

      const { messengerClientApiMethods } = readApiMemberNames();

      expect(messengerClientApiMethods).toStrictEqual(
        new Set(['perpsPlaceOrder']),
      );
    });
  });

  describe('getApiMethods', () => {
    it('reads methods from MetamaskController.getApi and its spreads', () => {
      mockSourceFiles({
        controllerSource: `const sharedApi = { shared() {} };

class MetamaskController {
  getApi() {
    return {
      named: this.named,
      shorthand,
      method() {},
      ...sharedApi,
    };
  }

  setupControllerConnection() {
    const api = {
      ...this.getApi(),
      startSendingPatches: () => {},
    };
  }
}`,
      });

      const { getApiMethods } = readApiMemberNames();

      expect(getApiMethods).toStrictEqual(
        new Set(['named', 'shorthand', 'method', 'shared']),
      );
    });
  });

  describe('adhocControllerConnectionMethods', () => {
    it('reads methods added in setupControllerConnection outside of getApi and messengerClientApi', () => {
      mockSourceFiles({
        controllerSource: `import { getTransactionControllerApi } from './wallet-init/instance-options/transaction-controller';

class PerpsStreamBridge {
  bridgeApi() {
    return { perpsInitForAccount() {} };
  }
}

class MetamaskController {
  getApi() {
    return { setLocked() {} };
  }

  setupControllerConnection() {
    const perpsStream = perpsController ? new PerpsStreamBridge() : null;
    const api = {
      ...this.getApi(),
      ...getTransactionControllerApi(this.txController),
      ...(perpsStream ? perpsStream.bridgeApi() : {}),
      startSendingPatches: () => {},
      getStatePatches: () => {},
    };
  }
}`,
        otherSources: {
          'app/scripts/wallet-init/instance-options/transaction-controller.ts': `export function getTransactionControllerApi(transactionController) {
  return {
    abortTransactionSigning: transactionController.abortTransactionSigning.bind(transactionController),
    getLayer1GasFee: transactionController.getLayer1GasFee.bind(transactionController),
  };
}`,
        },
      });

      const { adhocControllerConnectionMethods } = readApiMemberNames();

      expect(adhocControllerConnectionMethods).toStrictEqual(
        new Set([
          'abortTransactionSigning',
          'getLayer1GasFee',
          'perpsInitForAccount',
          'startSendingPatches',
          'getStatePatches',
        ]),
      );
    });

    it('throws when the api variable is not initialized with an object literal', () => {
      mockSourceFiles({
        controllerSource: `class MetamaskController {
        setupControllerConnection() {
          const api = createApi();
        }
      }`,
      });

      expect(() => readApiMemberNames()).toThrow(
        'MetamaskController.setupControllerConnection api must be an object literal',
      );
    });
  });

  it('reads an imported file only once', () => {
    mockSourceFiles({
      controllerSource: `import { createApi } from './create-api';
      class MetamaskController {
        setupControllerConnection() { const api = { ...createApi() }; }
      }`,
      otherSources: {
        'app/scripts/create-api.ts':
          'export function createApi() { return { imported() {} }; }',
      },
    });

    readApiMemberNames();

    const readPaths = mockReadFileSync.mock.calls.map(([path]) => String(path));
    expect(
      readPaths.filter((path) => path.endsWith('app/scripts/create-api.ts')),
    ).toHaveLength(1);
  });

  it('throws when an imported file exists but cannot be read', () => {
    mockSourceFiles({
      controllerSource: `import { createApi } from './create-api';
      class MetamaskController {
        setupControllerConnection() { const api = { ...createApi() }; }
      }`,
    });
    const readFileSyncWithMissingFiles =
      mockReadFileSync.getMockImplementation();
    mockReadFileSync.mockImplementation((path, options) => {
      if (String(path).endsWith('app/scripts/create-api.ts')) {
        throw Object.assign(
          new Error(`EACCES: permission denied, open '${String(path)}'`),
          { code: 'EACCES' },
        );
      }
      assert(readFileSyncWithMissingFiles);
      return readFileSyncWithMissingFiles(path, options);
    });

    expect(() => readApiMemberNames()).toThrow('EACCES: permission denied');
  });

  it('reads each source file only once', () => {
    mockSourceFiles({
      controllerSource: `class MetamaskController {
        getApi() { return { setLocked() {} }; }
        setupControllerConnection() {
          const api = { ...this.getApi(), startSendingPatches: () => {} };
        }
      }`,
      serviceSource: 'class LegacyBackgroundApiService { serviceMethod() {} }',
    });

    readApiMemberNames();

    const readPaths = mockReadFileSync.mock.calls.map(([path]) => String(path));
    expect(
      readPaths.filter((path) => path === METAMASK_CONTROLLER_FILE_PATH),
    ).toHaveLength(1);
    expect(
      readPaths.filter(
        (path) => path === LEGACY_BACKGROUND_API_SERVICE_FILE_PATH,
      ),
    ).toHaveLength(1);
  });

  describe('legacyBackgroundApiServiceMethods', () => {
    it('includes public and async methods but ignores data fields and private methods', () => {
      mockSourceFiles({
        serviceSource: `class LegacyBackgroundApiService {
          readonly field: unknown;
          publicMethod() {}
          async asyncMethod() {}
          #privateMethod() {}
          private privateMethod() {}
          protected protectedMethod() {}
        }`,
      });

      const { legacyBackgroundApiServiceMethods } = readApiMemberNames();

      expect(legacyBackgroundApiServiceMethods).toStrictEqual(
        new Set(['publicMethod', 'asyncMethod']),
      );
    });

    it('includes public getters', () => {
      mockSourceFiles({
        serviceSource: `class LegacyBackgroundApiService {
          get publicGetter(): number { return 1; }
          private get privateGetter(): number { return 2; }
        }`,
      });

      const { legacyBackgroundApiServiceMethods } = readApiMemberNames();

      expect(legacyBackgroundApiServiceMethods).toStrictEqual(
        new Set(['publicGetter']),
      );
    });

    it('includes public properties initialized to a function', () => {
      mockSourceFiles({
        serviceSource: `class LegacyBackgroundApiService {
          publicArrow = async (options: unknown): Promise<void> => {};
          publicFunction = function () {};
          dataField = 42;
          #privateArrow = () => {};
          private privateArrow = () => {};
        }`,
      });

      const { legacyBackgroundApiServiceMethods } = readApiMemberNames();

      expect(legacyBackgroundApiServiceMethods).toStrictEqual(
        new Set(['publicArrow', 'publicFunction']),
      );
    });

    it('ignores methods in nested classes', () => {
      mockSourceFiles({
        serviceSource: `class LegacyBackgroundApiService {
          publicMethod() { class Nested { ignored() {} } }
        }`,
      });

      const { legacyBackgroundApiServiceMethods } = readApiMemberNames();

      expect(legacyBackgroundApiServiceMethods).toStrictEqual(
        new Set(['publicMethod']),
      );
    });

    it('fails when the class is not present', () => {
      mockSourceFiles({ serviceSource: 'class OtherService {}' });

      expect(() => readApiMemberNames()).toThrow(
        'LegacyBackgroundApiService was not found',
      );
    });
  });
});

/**
 * Points the mocked filesystem at the given source files.
 *
 * Each test only cares about one of the tracked files, so the other one
 * defaults to a minimal valid source.
 *
 * @param options - The sources to serve.
 * @param options.controllerSource - The source of the file that defines
 * `MetamaskController`.
 * @param options.serviceSource - The source of the file that defines
 * `LegacyBackgroundApiService`.
 * @param options.otherSources - Sources of imported files, keyed by a suffix
 * of their path.
 */
function mockSourceFiles({
  controllerSource = `class MetamaskController {
    setupControllerConnection() { const api = {}; }
  }`,
  serviceSource = 'class LegacyBackgroundApiService {}',
  otherSources = {},
}: {
  controllerSource?: string;
  serviceSource?: string;
  otherSources?: Record<string, string>;
}): void {
  const contentsByPathSuffix: Record<string, string> = {
    [METAMASK_CONTROLLER_FILE_PATH]: controllerSource,
    [LEGACY_BACKGROUND_API_SERVICE_FILE_PATH]: serviceSource,
    ...otherSources,
  };

  mockReadFileSync.mockImplementation((path) => {
    const pathSuffix = Object.keys(contentsByPathSuffix).find((suffix) =>
      String(path).endsWith(suffix),
    );
    if (pathSuffix === undefined) {
      throw Object.assign(
        new Error(`ENOENT: no such file or directory, open '${String(path)}'`),
        { code: 'ENOENT' },
      );
    }
    return contentsByPathSuffix[pathSuffix];
  });
}
