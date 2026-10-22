/** @jest-environment node */
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

const mockExecFileSync = jest.fn();
const mockDownloadBuilds = jest.fn();
const mockGetGitHubToken = jest.fn();
const mockOctokitRequest = jest.fn();
const mockOctokitConstructor = jest.fn();
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

jest.mock('node:child_process', () => ({
  execFileSync: mockExecFileSync,
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

function clearBranchEnv(): void {
  delete process.env.BRANCH;
  delete process.env.GITHUB_HEAD_REF;
  delete process.env.GITHUB_REF_NAME;
}

describe('download-builds-cli', () => {
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
    clearBranchEnv();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    process.exitCode = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('uses the current git branch as the default branch', async () => {
    mockExecFileSync.mockReturnValue('feature/download-builds\n');

    await importCli();

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['symbolic-ref', '--short', 'HEAD'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    );
    expect(getOption('--branch').default).toHaveBeenCalledWith(
      'feature/download-builds',
    );
  });

  it('falls back to main when git branch detection fails', async () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('git unavailable');
    });

    await importCli();

    expect(getOption('--branch').default).toHaveBeenCalledWith('main');
  });

  it('invokes download builds and uses the fallback GitHub token helper', async () => {
    mockExecFileSync.mockReturnValue('feature/download-builds\n');
    const metadata = {
      runId: 123,
      requestedCommit: 'requested-sha',
      runHeadCommit: 'donor-sha',
      buildCommit: 'merge-sha',
      destination: '/tmp/dist',
      version: '13.53.0',
      downloads: { chrome: 'https://example.invalid/build.zip' },
    };
    mockDownloadBuilds.mockResolvedValue(metadata);

    await importCli();

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
      'Build run: 123 · source: requested-sha · run head: donor-sha · build: merge-sha',
    );
    expect(console.log).toHaveBeenNthCalledWith(
      2,
      'Builds downloaded and unzipped successfully.',
    );
  });

  it('reports parse failures', async () => {
    mockExecFileSync.mockReturnValue('feature/download-builds\n');
    mockProgram.parseAsync.mockImplementation(() =>
      Promise.reject(new Error('parse failed')),
    );

    await importCli();
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(getOption('--branch').default).toHaveBeenCalledWith(
      'feature/download-builds',
    );
    expect(console.error).toHaveBeenCalledWith('parse failed');
    expect(process.exitCode).toBe(1);
  });
});
