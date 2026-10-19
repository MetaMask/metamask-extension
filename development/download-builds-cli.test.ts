/** @jest-environment node */
import { join } from 'node:path';
import type { DownloadBuildsOptions } from './download-builds';

type ActionArgs = DownloadBuildsOptions & {
  githubToken: string;
};

type MockOptionInstance = {
  flags: string;
  default: jest.Mock;
  env: jest.Mock;
  choices: jest.Mock;
};

type MockStats = {
  isDirectory: () => boolean;
};

const mockDownloadBuilds = jest.fn();
const mockGetGitHubToken = jest.fn();
const mockOctokitRequest = jest.fn();
const mockOctokitConstructor = jest.fn();
const mockReadFileSync = jest.fn();
const mockStatSync = jest.fn();
const mockOptionInstances: MockOptionInstance[] = [];

let mockActionCallback: ((args: ActionArgs) => Promise<void>) | undefined;
const mockProgram: {
  name: jest.Mock;
  addOption: jest.Mock;
  option: jest.Mock;
  action: jest.Mock;
  parseAsync: jest.Mock;
} = {
  name: jest.fn().mockReturnThis(),
  addOption: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  action: jest.fn((callback: typeof mockActionCallback) => {
    mockActionCallback = callback;
    return mockProgram;
  }),
  parseAsync: jest.fn(() => Promise.resolve()),
};

class MockOptionClass implements MockOptionInstance {
  public default = jest.fn().mockReturnThis();

  public env = jest.fn().mockReturnThis();

  public choices = jest.fn().mockReturnThis();

  public flags: string;

  public description: string;

  constructor(flags: string, description: string) {
    this.flags = flags;
    this.description = description;
    mockOptionInstances.push(this);
  }
}

jest.mock('node:fs', () => ({
  readFileSync: mockReadFileSync,
  statSync: mockStatSync,
}));

jest.mock('commander', () => ({
  Option: MockOptionClass,
  program: mockProgram,
}));

jest.mock('../.github/scripts/shared/github-token.mts', () => ({
  getGitHubToken: mockGetGitHubToken,
}));

jest.mock('./download-builds', () => ({
  downloadBuilds: mockDownloadBuilds,
}));

jest.mock('octokit', () => ({
  Octokit: mockOctokitConstructor,
}));

async function importCli(): Promise<void> {
  await jest.isolateModulesAsync(async () => {
    await import('./download-builds-cli');
  });
}

function getOption(flags: string): MockOptionInstance {
  const option = mockOptionInstances.find((instance) =>
    instance.flags.includes(flags),
  );
  if (!option) {
    throw new Error(`Missing option ${flags}`);
  }
  return option;
}

describe('download-builds-cli', () => {
  let cwdSpy: jest.SpiedFunction<typeof process.cwd>;
  const scriptPath =
    '/tmp/metamask-extension/development/download-builds-cli.ts';
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOptionInstances.splice(0, mockOptionInstances.length);
    mockActionCallback = undefined;
    mockProgram.parseAsync.mockImplementation(() => Promise.resolve());
    mockGetGitHubToken.mockReturnValue('fallback-token');
    mockOctokitRequest.mockResolvedValue({});
    mockOctokitConstructor.mockImplementation(() => ({
      request: mockOctokitRequest,
    }));
    mockStatSync.mockReturnValue({
      isDirectory: () => true,
    } satisfies MockStats);
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.endsWith('/.git/HEAD')) {
        return 'ref: refs/heads/feature/download-builds\n';
      }
      throw new Error(`Unexpected read path: ${path}`);
    });
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/tmp');
    process.argv = ['node', scriptPath];
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.argv = originalArgv;
    jest.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('uses the current git branch, downloads builds, and falls back to the GitHub token helper', async () => {
    const metadata = {
      runId: 123,
      requestedCommit: 'requested-sha',
      buildCommit: 'donor-sha',
      destination: '/tmp/dist',
      version: '13.53.0',
      downloads: { chrome: 'https://example.invalid/build.zip' },
    };
    mockDownloadBuilds.mockResolvedValue(metadata);

    await importCli();

    expect(cwdSpy).toHaveBeenCalledTimes(0);
    expect(mockStatSync).toHaveBeenCalledWith(
      join(scriptPath, '..', '..', '.git'),
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(
      join(scriptPath, '..', '..', '.git', 'HEAD'),
      'utf8',
    );
    expect(getOption('--branch').default).toHaveBeenCalledWith(
      'feature/download-builds',
    );
    expect(mockOctokitConstructor).not.toHaveBeenCalled();

    await mockActionCallback?.({
      owner: 'metamask',
      repository: 'metamask-extension',
      workflowId: 'main.yml',
      branch: 'feature/download-builds',
      buildType: 'main',
      browser: 'chrome',
      destination: 'dist',
      waitSeconds: 1200,
      pollSeconds: 20,
      awsCloudfrontUrl: 'https://fixture.invalid',
      githubToken: '',
    });

    expect(mockGetGitHubToken).toHaveBeenCalledTimes(1);
    expect(mockDownloadBuilds).toHaveBeenCalledWith(
      expect.objectContaining({
        githubToken: '',
        branch: 'feature/download-builds',
        browser: 'chrome',
        buildType: 'main',
      }),
      expect.objectContaining({
        api: expect.any(Function),
      }),
    );
    expect(mockOctokitConstructor).toHaveBeenCalledWith({
      auth: 'fallback-token',
    });
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      'Build run: 123 · source: requested-sha · donor: donor-sha',
    );
    expect(console.log).toHaveBeenNthCalledWith(
      2,
      'Builds downloaded and unzipped successfully.',
    );
  });

  it('falls back to main and reports parse failures', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockStatSync.mockImplementation(() => {
      throw new Error('git unavailable');
    });
    mockProgram.parseAsync.mockImplementation(() =>
      Promise.reject(new Error('parse failed')),
    );

    await importCli();
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(cwdSpy).toHaveBeenCalledTimes(0);
    expect(mockStatSync).toHaveBeenCalledWith(
      join(scriptPath, '..', '..', '.git'),
    );
    expect(getOption('--branch').default).toHaveBeenCalledWith('main');
    expect(consoleError).toHaveBeenCalledWith('parse failed');
    expect(process.exitCode).toBe(1);
  });
});
