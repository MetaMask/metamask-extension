import { existsSync, readFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { check } from './check';
import { CommandError } from './command-error';
import { SNAPSHOT_PATH } from './constants';
import {
  LEGACY_BACKGROUND_API_SERVICE_FILE_PATH,
  METAMASK_CONTROLLER_FILE_PATH,
} from './legacy-apis';

/**
 * The source files that each tracked API is parsed from.
 */
type SourceFixtures = {
  /**
   * The source of the file that defines `MetamaskController`.
   */
  controllerSource: string;
  /**
   * The source of the file that defines `LegacyBackgroundApiService`.
   */
  serviceSource: string;
};

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockExistsSync = jest.mocked(existsSync);
const mockReadFileSync = jest.mocked(readFileSync);

describe('check', () => {
  beforeEach(() => {
    mockExistsSync.mockReturnValue(true);
  });

  it('reports success and does not throw when the APIs match the snapshot', () => {
    mockFiles({
      snapshot: {
        legacyBackgroundApiServiceMethods: ['serviceMethod'],
        messengerClientApiMethods: [],
        getApiMethods: ['getApiMethod'],
        adhocControllerConnectionMethods: [],
      },
      controllerSource: `class MetamaskController {
        getApi() { return { getApiMethod: this.getApiMethod }; }

        setupControllerConnection() {
          const api = { ...this.getApi() };
        }
      }`,
      serviceSource: `class LegacyBackgroundApiService {
        serviceMethod() {}
      }`,
    });
    const { stdout, stderr } = createStreams();

    check({ stdout, stderr });

    expect(stdout.getWrittenText()).toContain(
      'No changes detected in legacy background APIs, all good.',
    );
  });

  it('throws a CommandError when an API has a member missing from the snapshot', () => {
    mockFiles({
      snapshot: {
        legacyBackgroundApiServiceMethods: ['serviceMethod'],
        messengerClientApiMethods: [],
        getApiMethods: [],
        adhocControllerConnectionMethods: [],
      },
      controllerSource: `class MetamaskController {
        getApi() { return { getApiMethod: this.getApiMethod }; }

        setupControllerConnection() {
          const api = { ...this.getApi() };
        }
      }`,
      serviceSource: `class LegacyBackgroundApiService {
        serviceMethod() {}
      }`,
    });
    const { stdout, stderr } = createStreams();

    expect(() => check({ stdout, stderr })).toThrow(CommandError);

    expect(stderr.getWrittenText()).toContain(
      'ERROR: New methods have been added to some UI<->background APIs which are deprecated. More details below.',
    );
    expect(stderr.getWrittenText()).toContain('getApiMethod');
  });

  it('lists the new members of each API under its own explanation', () => {
    mockFiles({
      snapshot: {
        legacyBackgroundApiServiceMethods: [],
        messengerClientApiMethods: [],
        getApiMethods: [],
        adhocControllerConnectionMethods: [],
      },
      controllerSource: `const TransactionPayControllerInit = () => ({
        messengerClient: {},
        api: { setTransactionPayPaymentOverride() {} },
      });
      class MetamaskController {
        constructor() {
          const messengerClientInitFunctions = {
            TransactionPayController: TransactionPayControllerInit,
          };
        }

        getApi() { return { addNftVerifyOwnership() {} }; }

        setupControllerConnection() {
          const api = {
            ...this.getApi(),
            ...this.messengerClientApi,
            perpsDeactivateCandleStream: () => {},
          };
        }
      }`,
      serviceSource: `class LegacyBackgroundApiService {
        addPermittedChains() {}
      }`,
    });
    const { stdout, stderr } = createStreams();

    expect(() => check({ stdout, stderr })).toThrow(CommandError);

    expect(stderr.getWrittenText()).toContain(
      [
        '- New methods have been added to LegacyBackgroundApiService:',
        '  - addPermittedChains',
        '- Some controller/service init functions return an `api` object that includes new methods:',
        '  - setTransactionPayPaymentOverride',
        '- New methods have been added to the API object returned by MetamaskController.getApi():',
        '  - addNftVerifyOwnership',
        '- New methods have been directly (or indirectly) added to the API object returned by MetamaskController.setupControllerConnection():',
        '  - perpsDeactivateCandleStream',
      ].join('\n'),
    );
  });

  it('explains how to access controllers and services without extending the APIs', () => {
    mockFiles({
      snapshot: {
        legacyBackgroundApiServiceMethods: [],
        messengerClientApiMethods: [],
        getApiMethods: [],
        adhocControllerConnectionMethods: [],
      },
      controllerSource: `class MetamaskController {
        setupControllerConnection() {
          const api = { startSendingPatches: () => {} };
        }
      }`,
      serviceSource: 'class LegacyBackgroundApiService {}',
    });
    const { stdout, stderr } = createStreams();

    expect(() => check({ stdout, stderr })).toThrow(CommandError);

    expect(stderr.getWrittenText()).toContain(
      'The Core Platform team has requested that these APIs not be extended further,\nand has developed a new process for accessing controllers and services through the UI:\n\n1. Go to the controller or service',
    );
  });

  it('throws a CommandError when the snapshot has a member missing from the API', () => {
    mockFiles({
      snapshot: {
        legacyBackgroundApiServiceMethods: ['serviceMethod', 'removedMethod'],
        messengerClientApiMethods: [],
        getApiMethods: ['getApiMethod'],
        adhocControllerConnectionMethods: [],
      },
      controllerSource: `class MetamaskController {
        getApi() { return { getApiMethod: this.getApiMethod }; }

        setupControllerConnection() {
          const api = { ...this.getApi() };
        }
      }`,
      serviceSource: `class LegacyBackgroundApiService {
        serviceMethod() {}
      }`,
    });
    const { stdout, stderr } = createStreams();

    expect(() => check({ stdout, stderr })).toThrow(CommandError);

    expect(stderr.getWrittenText()).toContain(
      'Methods have been removed from some legacy background APIs',
    );
    expect(stderr.getWrittenText()).toContain('removedMethod');
  });
});

/**
 * Points the mocked filesystem at the given snapshot and source files, keyed
 * by the real paths that `check` reads.
 *
 * @param options - The fixtures to serve.
 * @param options.snapshot - The parsed snapshot to serve as JSON.
 * @param options.controllerSource - The source of the controller file.
 * @param options.serviceSource - The source of the service file.
 */
function mockFiles({
  snapshot,
  controllerSource,
  serviceSource,
}: {
  snapshot: Record<string, string[]>;
} & SourceFixtures): void {
  const contentsByPath: Record<string, string> = {
    [SNAPSHOT_PATH]: JSON.stringify(snapshot),
    [METAMASK_CONTROLLER_FILE_PATH]: controllerSource,
    [LEGACY_BACKGROUND_API_SERVICE_FILE_PATH]: serviceSource,
  };

  mockReadFileSync.mockImplementation((path) => {
    const contents = contentsByPath[String(path)];
    if (contents === undefined) {
      throw new Error(`Unexpected read of "${String(path)}"`);
    }
    return contents;
  });
}

function createStreams() {
  return {
    stdout: createMemoryWritable(),
    stderr: createMemoryWritable(),
  };
}

function createMemoryWritable() {
  let writtenText = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      writtenText += chunk.toString();
      callback();
    },
  });

  return Object.assign(stream, {
    getWrittenText: () => writtenText,
  });
}
