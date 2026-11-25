import { postOrPrint, requireSlackInCi } from './post-slack.mts';

const payload = { text: 'hello', blocks: [] };
const original = { ...process.env };

const reply = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

function setEnv(values: Record<string, string | undefined>) {
  for (const key of ['GITHUB_EVENT_NAME', 'SLACK_BOT_TOKEN', 'SLACK_CHANNEL']) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  process.env = { ...original };
  jest.restoreAllMocks();
});

describe('requireSlackInCi', () => {
  it('allows a missing token on a manual run', () => {
    setEnv({ GITHUB_EVENT_NAME: 'workflow_dispatch' });
    expect(() => requireSlackInCi()).not.toThrow();
  });

  it('fails on workflow_run and schedule without a token', () => {
    for (const event of ['workflow_run', 'schedule']) {
      setEnv({ GITHUB_EVENT_NAME: event, SLACK_CHANNEL: '#c' });
      expect(() => requireSlackInCi()).toThrow('SLACK_BOT_TOKEN');
    }
  });

  it('fails on workflow_run without a channel', () => {
    setEnv({ GITHUB_EVENT_NAME: 'workflow_run', SLACK_BOT_TOKEN: 'xoxb-1' });
    expect(() => requireSlackInCi()).toThrow('SLACK_CHANNEL');
  });
});

describe('postOrPrint', () => {
  it('prints the message and does not post without a token', async () => {
    setEnv({});
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => 0);
    await postOrPrint(payload);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('SLACK_BOT_TOKEN is not set; dry run:');
  });

  it('posts with the bot token to the channel', async () => {
    setEnv({ SLACK_BOT_TOKEN: 'xoxb-1', SLACK_CHANNEL: '#detector' });
    jest.spyOn(console, 'log').mockImplementation(() => 0);
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(reply({ ok: true }));
    await postOrPrint(payload);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://slack.com/api/chat.postMessage');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer xoxb-1',
    );
    expect(JSON.parse(init?.body as string)).toStrictEqual({
      channel: '#detector',
      blocks: [],
      text: 'hello',
      unfurl_links: false,
      unfurl_media: false,
    });
  });

  it('throws when a token is set without a channel', async () => {
    setEnv({ SLACK_BOT_TOKEN: 'xoxb-1' });
    await expect(postOrPrint(payload)).rejects.toThrow('SLACK_CHANNEL');
  });

  it('throws the Slack error when the API answers ok: false', async () => {
    setEnv({ SLACK_BOT_TOKEN: 'xoxb-1', SLACK_CHANNEL: '#detector' });
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(reply({ ok: false, error: 'not_in_channel' }));
    await expect(postOrPrint(payload)).rejects.toThrow('not_in_channel');
  });

  it('throws on an HTTP error', async () => {
    setEnv({ SLACK_BOT_TOKEN: 'xoxb-1', SLACK_CHANNEL: '#detector' });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(reply({}, 500));
    await expect(postOrPrint(payload)).rejects.toThrow('500');
  });
});
