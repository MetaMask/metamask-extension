/** @jest-environment node */

/* eslint-disable @typescript-eslint/naming-convention -- Braze wire field names. */
import { sendBrazeSession } from './braze-request';

describe('sendBrazeSession', () => {
  const url = 'https://sdk.synthetic.braze.com/api/v3/data/';
  const profile = 'canonical-profile';
  const apiKey = 'public-test-key';
  const deviceId = '00000000-0000-4000-8000-000000000001';
  const sessionId = '00000000-0000-4000-8000-000000000002';
  const body = JSON.stringify({
    respond_with: { user_id: profile, triggers: true },
    events: [
      {
        name: 'ss',
        user_id: profile,
        session_id: sessionId,
        time: 1,
        data: { ignored: true },
      },
    ],
    device_id: deviceId,
    api_key: 'ignored',
    device: { user_agent: 'ignored' },
  });
  const request = { method: 'POST', url, body };
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let abort: AbortController;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
    abort = new AbortController();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reconstructs the session-start request without forwarding arbitrary SDK data', async () => {
    const response = new Response('{}');
    const cancel = jest.spyOn(response.body as ReadableStream, 'cancel');
    fetchMock.mockResolvedValue(response);

    expect(
      await sendBrazeSession(request, {
        url,
        apiKey,
        profile,
        signal: abort.signal,
      }),
    ).toBe(200);

    expect(fetchMock).toHaveBeenCalledWith(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: abort.signal,
      body: expect.any(String),
    });
    expect(
      JSON.parse(fetchMock.mock.calls[0][1]?.body as string),
    ).toStrictEqual({
      respond_with: { user_id: profile },
      events: [
        {
          name: 'ss',
          user_id: profile,
          session_id: sessionId,
          time: 1,
          data: {},
        },
      ],
      device_id: deviceId,
      api_key: apiKey,
      time: expect.any(Number),
      sdk_metadata: ['npm'],
      sdk_version: '7.0.0',
    });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('rejects other URLs, methods, profiles, and malformed payloads', async () => {
    for (const invalid of [
      { ...request, url: `${url}?extra=true` },
      { ...request, method: 'GET' },
      { ...request, body: body.replaceAll(profile, 'different-profile') },
      { ...request, body: 'not JSON' },
      { ...request, body: ' '.repeat(4097) },
    ]) {
      expect(
        await sendBrazeSession(invalid, {
          url,
          apiKey,
          profile,
          signal: abort.signal,
        }),
      ).toBe(0);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not send when eligibility has been revoked', async () => {
    abort.abort();

    expect(
      await sendBrazeSession(request, {
        url,
        apiKey,
        profile,
        signal: abort.signal,
      }),
    ).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
