/** @jest-environment node */
import { resolveBuildRun } from './resolve-build-run.mts';

const commit = 'a'.repeat(40);
const donor = 'b'.repeat(40);
const runUrl =
  'https://github.com/MetaMask/metamask-extension/actions/runs/123';
const options = {
  repository: 'MetaMask/metamask-extension',
  ref: commit,
  artifactNames: ['build-dist-webpack'],
  waitSeconds: 60,
  pollSeconds: 20,
};

function fixture({
  pointer = '123',
  artifact = true,
  expired = false,
  runStatus = 'in_progress',
  conclusion = null,
}: {
  pointer?: string;
  artifact?: boolean;
  expired?: boolean;
  runStatus?: string;
  conclusion?: string | null;
} = {}) {
  let clock = 0;
  const api = jest.fn(async (endpoint: string): Promise<unknown> => {
    if (endpoint.includes('/status?'))
      return {
        statuses: pointer
          ? [{ context: 'builds-from-run', description: pointer }]
          : [],
      };
    if (endpoint.includes('/artifacts?'))
      return {
        artifacts: artifact ? [{ name: 'build-dist-webpack', expired }] : [],
      };
    if (endpoint.includes('/jobs?'))
      return {
        jobs: [
          {
            name: 'build-dist-webpack / build-dist-webpack',
            status: conclusion ? 'completed' : 'in_progress',
            conclusion,
          },
        ],
      };
    if (endpoint.includes('/actions/runs/'))
      return { head_sha: donor, html_url: runUrl, status: runStatus };
    return { sha: commit };
  });
  return {
    api,
    sleep: jest.fn(async (ms: number) => {
      clock += ms;
    }),
    now: () => clock,
    log: jest.fn(),
  };
}

describe('resolveBuildRun', () => {
  it('resolves the donor before unrelated workflow jobs finish', async () => {
    const dependencies = fixture();
    expect(await resolveBuildRun(options, dependencies)).toStrictEqual({
      requestedCommit: commit,
      buildCommit: donor,
      runId: 123,
      runUrl,
      reusedBuild: true,
    });
    expect(dependencies.sleep).not.toHaveBeenCalled();
  });

  it('pins a branch once and waits for the pointer and artifact', async () => {
    const dependencies = fixture();
    const original = dependencies.api.getMockImplementation()!;
    let pointerChecks = 0;
    let artifactChecks = 0;
    dependencies.api.mockImplementation(async (endpoint) => {
      if (endpoint.includes('/status?') && pointerChecks++ === 0)
        return { statuses: [] };
      if (endpoint.includes('/artifacts?') && artifactChecks++ === 0)
        return { artifacts: [] };
      return original(endpoint);
    });
    const metadata = await resolveBuildRun(
      { ...options, ref: 'release/13.53.0' },
      dependencies,
    );
    expect(metadata.requestedCommit).toBe(commit);
    expect(
      dependencies.api.mock.calls.filter(([endpoint]) =>
        endpoint.endsWith('release%2F13.53.0'),
      ),
    ).toHaveLength(1);
    expect(dependencies.sleep).toHaveBeenCalledTimes(2);
  });

  it('times out while the build is running', async () => {
    const dependencies = fixture({ artifact: false });
    await expect(resolveBuildRun(options, dependencies)).rejects.toThrow(
      'Wait limit reached',
    );
    expect(dependencies.sleep).toHaveBeenCalledTimes(3);
  });

  it('reports failed builds, expired artifacts, and completed missing artifacts', async () => {
    await expect(
      resolveBuildRun(
        options,
        fixture({ artifact: false, conclusion: 'failure' }),
      ),
    ).rejects.toThrow('failure');
    await expect(
      resolveBuildRun(options, fixture({ expired: true })),
    ).rejects.toThrow('expired');
    await expect(
      resolveBuildRun(
        options,
        fixture({ artifact: false, runStatus: 'completed' }),
      ),
    ).rejects.toThrow('missing from completed run');
  });

  it('rejects malformed pointers', async () => {
    await expect(
      resolveBuildRun(options, fixture({ pointer: '../run' })),
    ).rejects.toThrow('Invalid');
  });

  it('requires all requested browser artifacts', async () => {
    await expect(
      resolveBuildRun(
        {
          ...options,
          artifactNames: ['build-dist-webpack', 'build-dist-mv2-webpack'],
          waitSeconds: 0,
        },
        fixture(),
      ),
    ).rejects.toThrow('build-dist-mv2-webpack');
  });

  it('paginates artifact lists to find the required artifact', async () => {
    const dependencies = fixture();
    const original = dependencies.api.getMockImplementation()!;
    dependencies.api.mockImplementation(async (endpoint) => {
      if (endpoint.includes('/artifacts?') && endpoint.endsWith('page=1')) {
        return {
          artifacts: Array.from({ length: 100 }, (_, index) => ({
            name: `other-${index}`,
            expired: false,
          })),
        };
      }
      return original(endpoint);
    });
    expect((await resolveBuildRun(options, dependencies)).runId).toBe(123);
    expect(dependencies.api).toHaveBeenCalledWith(
      expect.stringContaining('/artifacts?per_page=100&page=2'),
    );
  });
});
