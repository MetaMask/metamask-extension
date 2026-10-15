import { existsSync, readFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { check } from './check';
import { CommandError } from './command-error';
import { SNAPSHOT_PATH } from './constants';
import { LEGACY_APIS } from './legacy-apis';

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
        'MetamaskController.getApi': ['getApiMethod'],
        LegacyBackgroundApiService: ['serviceMethod'],
      },
      controllerSource: `class MetamaskController {
        getApi() { return { getApiMethod: this.getApiMethod }; }
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
        'MetamaskController.getApi': [],
        LegacyBackgroundApiService: ['serviceMethod'],
      },
      controllerSource: `class MetamaskController {
        getApi() { return { getApiMethod: this.getApiMethod }; }
      }`,
      serviceSource: `class LegacyBackgroundApiService {
        serviceMethod() {}
      }`,
    });
    const { stdout, stderr } = createStreams();

    expect(() => check({ stdout, stderr })).toThrow(CommandError);

    expect(stderr.getWrittenText()).toContain(
      'Extra methods have been added to some legacy background APIs',
    );
    expect(stderr.getWrittenText()).toContain('getApiMethod');
  });

  it('throws a CommandError when the snapshot has a member missing from the API', () => {
    mockFiles({
      snapshot: {
        'MetamaskController.getApi': ['getApiMethod'],
        LegacyBackgroundApiService: ['serviceMethod', 'removedMethod'],
      },
      controllerSource: `class MetamaskController {
        getApi() { return { getApiMethod: this.getApiMethod }; }
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
    [LEGACY_APIS['MetamaskController.getApi'].filePath]: controllerSource,
    [LEGACY_APIS.LegacyBackgroundApiService.filePath]: serviceSource,
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
