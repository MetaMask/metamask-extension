import { main } from './check-template-and-add-labels.mts';

const templateBody = [
  '## **Description**',
  '## **Changelog**',
  'CHANGELOG entry: Fixed a thing',
  '## **Related issues**',
  '## **Manual testing steps**',
  '## **Screenshots/Recordings**',
  '## **Pre-merge author checklist**',
  '## **Pre-merge reviewer checklist**',
].join('\n');

type SetupOptions = {
  labels?: string[];
  headRepo?: string;
  body?: string;
};

function setup({
  labels = [],
  headRepo = 'MetaMask/metamask-extension',
  body = templateBody,
}: SetupOptions) {
  const graphql = jest.fn(async (query: string) => {
    if (query.includes('RetrievePullRequestLabels')) {
      return {
        repository: {
          pullRequest: {
            id: 'PR_1',
            createdAt: '2026-11-19T00:00:00Z',
            body,
            author: { login: 'alice', __typename: 'User' },
            labels: {
              nodes: labels.map((name, index) => ({ id: `L_${index}`, name })),
            },
          },
        },
      };
    }
    if (query.includes('UserBelongsToMetaMaskOrg')) {
      return { user: { organization: { id: 'ORG_1' } } };
    }
    return {};
  });
  const github = { graphql, rest: {} } as never;
  const core = { error: jest.fn(), setFailed: jest.fn() };
  const context = {
    eventName: 'pull_request',
    repo: { owner: 'MetaMask', repo: 'metamask-extension' },
    payload: {
      action: 'synchronize',
      pull_request: {
        number: 1,
        base: { ref: 'main' },
        head: { repo: { full_name: headRepo } },
      },
    },
  } as never;
  return { graphql, github, core, context };
}

function labelWrites(graphql: jest.Mock): string[] {
  return graphql.mock.calls
    .map(([query]) => String(query))
    .filter((query) => query.includes('mutation'));
}

describe('check-template-and-add-labels on pull_request', () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
      code?: number,
    ) => {
      throw new Error(`process.exit(${code})`);
    }) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fails a same-repo PR carrying DO-NOT-MERGE', async () => {
    const { github, core, context } = setup({
      labels: ['team-extension-platform', 'DO-NOT-MERGE'],
    });

    await expect(main({ github, core, context })).rejects.toThrow(
      'process.exit(1)',
    );

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('DO-NOT-MERGE'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('fails a same-repo PR with no team label', async () => {
    const { github, core, context } = setup({ labels: [] });

    await expect(main({ github, core, context })).rejects.toThrow(
      'process.exit(1)',
    );

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('No team labels found'),
    );
  });

  it('passes a same-repo PR with a team label and a changelog line', async () => {
    const { github, core, context } = setup({
      labels: ['team-extension-platform'],
    });

    await main({ github, core, context });

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('passes a fork PR with no team label and writes no labels', async () => {
    const { graphql, github, core, context } = setup({
      labels: [],
      headRepo: 'someone/metamask-extension',
    });

    await main({ github, core, context });

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(labelWrites(graphql)).toStrictEqual([]);
  });

  it('fails a fork PR carrying DO-NOT-MERGE and writes no labels', async () => {
    const { graphql, github, core, context } = setup({
      labels: ['DO-NOT-MERGE'],
      headRepo: 'someone/metamask-extension',
    });

    await expect(main({ github, core, context })).rejects.toThrow(
      'process.exit(1)',
    );

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('DO-NOT-MERGE'),
    );
    expect(labelWrites(graphql)).toStrictEqual([]);
  });
});
