/** @jest-environment node */
import { describe, it } from '@jest/globals';
import { resolveBuildRun } from './resolve-build-run.mts';

const commit = 'a'.repeat(40);
const donor = 'b'.repeat(40);
const merge = 'c'.repeat(40);
const buildWorkflow = {
  path: `MetaMask/metamask-extension/.github/workflows/run-build.yml@${merge}`,
  ref: 'refs/pull/47118/merge',
  sha: merge,
};
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
  event = 'push',
  headSha = donor,
  referencedWorkflows,
}: {
  pointer?: string;
  artifact?: boolean;
  expired?: boolean;
  runStatus?: string;
  conclusion?: string | null;
  event?: string;
  headSha?: string;
  referencedWorkflows?: { path: string; ref?: string; sha: string }[];
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
      return {
        head_sha: headSha,
        html_url: runUrl,
        status: runStatus,
        event,
        referenced_workflows: referencedWorkflows,
      };
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
      runHeadCommit: donor,
      buildCommit: donor,
      runId: 123,
      runUrl,
      reusedBuild: true,
    });
    expect(dependencies.sleep).not.toHaveBeenCalled();
  });

  it.each([
    { headSha: commit, reusedBuild: false },
    { headSha: donor, reusedBuild: true },
  ])(
    'resolves the historical PR merge SHA with reuse=$reusedBuild',
    async ({ headSha, reusedBuild }) => {
      const metadata = await resolveBuildRun(
        // The CLI defaults to a lowercase owner; API workflow paths use MetaMask.
        { ...options, repository: 'metamask/metamask-extension' },
        fixture({
          event: 'pull_request',
          headSha,
          referencedWorkflows: [
            {
              ...buildWorkflow,
              path: 'other/repo/.github/workflows/run-build.yml@main',
              sha: donor,
            },
            {
              ...buildWorkflow,
              path: `MetaMask/metamask-extension/.github/workflows/run-e2e.yml@${donor}`,
              sha: donor,
            },
            buildWorkflow,
          ],
        }),
      );
      expect(metadata).toMatchObject({
        requestedCommit: commit,
        runHeadCommit: headSha,
        buildCommit: merge,
        reusedBuild,
      });
    },
  );

  it.each(['push', 'schedule', 'merge_group'])(
    'uses the run head for a %s run without referenced build workflow metadata',
    async (event) => {
      const metadata = await resolveBuildRun(options, fixture({ event }));
      expect(metadata.buildCommit).toBe(donor);
    },
  );

  it.each([
    { name: 'missing', referencedWorkflows: undefined },
    { name: 'empty', referencedWorkflows: [] },
    {
      name: 'another repository',
      referencedWorkflows: [
        { ...buildWorkflow, path: 'other/repo/.github/workflows/run-build.yml@main' },
      ],
    },
    {
      name: 'a mutable ref instead of a SHA',
      referencedWorkflows: [{ ...buildWorkflow, sha: 'refs/pull/47118/merge' }],
    },
    {
      name: 'ambiguous',
      referencedWorkflows: [buildWorkflow, { ...buildWorkflow, sha: donor }],
    },
  ])(
    'rejects PR build workflow metadata that is $name',
    async ({ referencedWorkflows }) => {
      await expect(
        resolveBuildRun(
          options,
          fixture({ event: 'pull_request', referencedWorkflows }),
        ),
      ).rejects.toThrow('Cannot determine build commit');
    },
  );

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
