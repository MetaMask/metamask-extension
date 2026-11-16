import { it } from '@jest/globals';
import {
  isBrazeWorkerRequest,
  isBrazeWorkerResponse,
  handleBrazeWorkerRequest,
} from './braze-worker-messages';

describe('isBrazeWorkerRequest', () => {
  it.each(['canonical-profile', null])('accepts identity %s', (profileId) => {
    expect(isBrazeWorkerRequest({ id: 1, profileId })).toBe(true);
  });

  it.each([
    null,
    'html',
    {},
    { id: 1 },
    { id: NaN, profileId: null },
    { id: '1', profileId: null },
    { id: 1, profileId: {} },
  ])('rejects malformed request %j', (value) => {
    expect(isBrazeWorkerRequest(value)).toBe(false);
  });
});

describe('handleBrazeWorkerRequest', () => {
  it('acknowledges identity synchronization without returning SDK objects', async () => {
    const sync = jest.fn().mockResolvedValue({ html: '<script></script>' });

    const response = await handleBrazeWorkerRequest(
      { id: 1, profileId: 'profile' },
      Promise.resolve(sync),
    );

    expect(sync).toHaveBeenCalledWith('profile');
    expect(response).toStrictEqual({ id: 1, success: true });
  });

  it('ignores requests to render content', async () => {
    const sync = jest.fn();

    const response = await handleBrazeWorkerRequest(
      { html: '<script></script>' },
      Promise.resolve(sync),
    );

    expect(sync).not.toHaveBeenCalled();
    expect(response).toBeUndefined();
  });

  it('returns a fixed error instead of SDK-supplied content', async () => {
    const sync = jest
      .fn()
      .mockRejectedValue(new Error('<script>remote()</script>'));

    const response = await handleBrazeWorkerRequest(
      { id: 1, profileId: null },
      Promise.resolve(sync),
    );

    expect(response).toStrictEqual({
      id: 1,
      success: false,
      error: 'Braze worker sync failed',
    });
  });
});

describe('isBrazeWorkerResponse', () => {
  it.each([
    { id: 1, success: true },
    { id: 1, success: false, error: 'failed' },
  ])('accepts acknowledgement %j', (value) => {
    expect(isBrazeWorkerResponse(value)).toBe(true);
  });

  it.each([
    null,
    {},
    { id: 1, html: '<script></script>' },
    { id: 1, success: false },
    { id: '1', success: true },
    { id: Infinity, success: true },
  ])('rejects unsupported response %j', (value) => {
    expect(isBrazeWorkerResponse(value)).toBe(false);
  });
});
