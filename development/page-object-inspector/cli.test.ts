import fs from 'node:fs';
import { run } from './cli';

jest.mock('node:fs', () => {
  const actual = jest.requireActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
});

const mockedFs = jest.mocked(fs);

const PAGE_OBJECT_SOURCE = `
class HomePage {
  private readonly sendButton = '[data-testid="eth-overview-send"]';
}
`;

describe('page-object inspector CLI', () => {
  beforeEach(() => {
    mockedFs.readdirSync.mockReturnValue(['home.ts'] as never);
    mockedFs.readFileSync.mockReturnValue(PAGE_OBJECT_SOURCE);
    mockedFs.mkdirSync.mockReset();
    mockedFs.writeFileSync.mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints help and exits 0', () => {
    expect(run(['--help'])).toBe(0);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('yarn page-objects:index'),
    );
  });

  it('prints the error and help, then exits 2', () => {
    expect(run(['unknown-command'])).toBe(2);
    expect(console.error).toHaveBeenCalledWith(
      'Unknown command: unknown-command',
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('yarn page-objects:index'),
    );
  });

  it('writes index artifacts for the index command', () => {
    expect(run(['index'])).toBe(0);
    expect(mockedFs.mkdirSync).toHaveBeenCalled();
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Page Object Index'),
    );
  });

  it('prints JSON including the files it wrote', () => {
    expect(run(['index', '--json'])).toBe(0);
    const payload = JSON.parse(
      (console.log as jest.Mock).mock.calls[0][0] as string,
    );
    expect(payload.command).toBe('index');
    expect(payload.wrote).toStrictEqual(
      expect.arrayContaining([
        expect.stringContaining('index.json'),
        expect.stringContaining('runtime-index.json'),
      ]),
    );
  });

  it('prints the overlaps report without writing artifacts', () => {
    expect(run(['overlaps'])).toBe(0);
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/overlap|No overlapping/iu),
    );
  });

  it('prints overlaps as JSON without a wrote field', () => {
    expect(run(['overlaps', '--json'])).toBe(0);
    const payload = JSON.parse(
      (console.log as jest.Mock).mock.calls[0][0] as string,
    );
    expect(payload.command).toBe('overlaps');
    expect(payload.wrote).toBeUndefined();
  });

  it('exits 1 when --fail-on-overlap is set and overlaps exist', () => {
    mockedFs.readdirSync.mockReturnValue(['a.ts', 'b.ts'] as never);
    mockedFs.readFileSync.mockImplementation(
      (filePath: fs.PathOrFileDescriptor) => {
        const path = String(filePath);
        if (path.endsWith('a.ts')) {
          return `
          class AlphaPage {
            private readonly shared = '[data-testid="shared"]';
          }
        `;
        }
        return `
        class BetaPage {
          private readonly shared = '[data-testid="shared"]';
        }
      `;
      },
    );

    expect(run(['overlaps', '--fail-on-overlap'])).toBe(1);
  });
});
