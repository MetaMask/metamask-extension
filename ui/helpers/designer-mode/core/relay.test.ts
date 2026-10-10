import { RelayClient } from './relay';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('RelayClient', () => {
  let fetchMock: jest.Mock;

  beforeAll(() => {
    // jsdom's AbortSignal lacks the static timeout() used by checkHealth.
    if (typeof AbortSignal.timeout !== 'function') {
      AbortSignal.timeout = () => new AbortController().signal;
    }
  });

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('sendMessage', () => {
    it('POSTs the prompt to /api/message and starts polling on success', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, status: 200 }) // /api/message
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'done',
        }); // /api/poll
      const client = new RelayClient('http://localhost:3334');
      const onResponse = jest.fn();
      client.onResponse(onResponse);

      await client.sendMessage('=== DESIGNER MODE REQUEST ===\nbody');
      await flush();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3334/api/message',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(onResponse).toHaveBeenCalledWith('done');
    });

    it('throws and does not poll when the relay rejects the message', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 413 });
      const client = new RelayClient('http://localhost:3334');

      await expect(client.sendMessage('too big')).rejects.toThrow(
        'relay rejected message (413)',
      );
      await flush();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('stops polling after the response is delivered', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'first',
        });
      const client = new RelayClient('http://localhost:3334');
      client.onResponse(jest.fn());

      await client.sendMessage('req');
      await flush();
      const callsAfterDelivery = fetchMock.mock.calls.length;
      await flush();

      expect(fetchMock.mock.calls.length).toBe(callsAfterDelivery);
    });

    it('keeps polling across 204 poll timeouts until a response arrives', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, status: 200 }) // /api/message
        .mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'late reply',
        });
      const client = new RelayClient('http://localhost:3334');
      const onResponse = jest.fn();
      client.onResponse(onResponse);

      await client.sendMessage('req');
      await flush();

      expect(onResponse).toHaveBeenCalledWith('late reply');
    });
  });

  describe('stopPolling', () => {
    it('prevents further poll requests', async () => {
      const client = new RelayClient('http://localhost:3334');
      fetchMock
        .mockResolvedValueOnce({ ok: true, status: 200 }) // /api/message
        .mockImplementation(async () => {
          client.stopPolling();
          return { ok: true, status: 204, text: async () => '' };
        });
      client.onResponse(jest.fn());

      await client.sendMessage('req');
      await flush();
      const callsAfterStop = fetchMock.mock.calls.length;
      await flush();

      expect(fetchMock.mock.calls.length).toBe(callsAfterStop);
    });
  });

  describe('checkHealth', () => {
    it('returns connected when /api/health responds ok', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
      const client = new RelayClient('http://localhost:3334');

      await expect(client.checkHealth()).resolves.toBe('connected');
    });

    it('returns disconnected on a non-ok response', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      const client = new RelayClient('http://localhost:3334');

      await expect(client.checkHealth()).resolves.toBe('disconnected');
    });

    it('returns disconnected when the relay is unreachable', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      const client = new RelayClient('http://localhost:3334');

      await expect(client.checkHealth()).resolves.toBe('disconnected');
    });
  });
});
