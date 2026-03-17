import { buildSectionWithFallback, postCommentWithMetamaskBot } from './utils';

describe('buildSectionWithFallback', () => {
  it('returns the builder result when it resolves with a string', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve('<p>ok</p>'),
      'Test section',
    );

    expect(result).toBe('<p>ok</p>');
  });

  it('returns fallback when builder resolves null', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(null),
      'Test section',
    );

    expect(result).toBe('<p><i>Test section: data not available.</i></p>\n\n');
  });

  it('returns fallback when builder resolves with undefined', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(undefined),
      'Test section',
    );

    expect(result).toBe('<p><i>Test section: data not available.</i></p>\n\n');
  });

  it('returns fallback when builder resolves with no data returned', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(''),
      'Test section',
    );

    expect(result).toBe('<p><i>Test section: data not available.</i></p>\n\n');
  });

  it('returns fallback and logs the error when builder throws', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await buildSectionWithFallback(
      () => Promise.reject(new Error('boom')),
      'Broken section',
    );

    expect(result).toBe(
      '<p><i>Broken section: data not available.</i></p>\n\n',
    );
    expect(logSpy).toHaveBeenCalledWith(
      'No data available for Broken section; skipping (Error: boom)',
    );

    logSpy.mockRestore();
  });
});

describe('postCommentWithMetamaskBot', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockFetch.mockReset();
  });

  const baseParams = {
    commentBody: '<p>hello</p>',
    owner: 'MetaMask',
    repository: 'metamask-extension',
    prNumber: '42',
    commentToken: 'secret-token',
  };

  it('returns null when commentToken is not provided', async () => {
    const result = await postCommentWithMetamaskBot({
      ...baseParams,
      commentToken: undefined,
    });

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('logs optionalLog when provided', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    mockFetch.mockResolvedValue({ ok: true } as Response);

    await postCommentWithMetamaskBot({
      ...baseParams,
      optionalLog: 'debug info',
    });

    expect(logSpy).toHaveBeenCalledWith('debug info');
  });

  it('posts to the correct GitHub issues API URL', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);

    await postCommentWithMetamaskBot(baseParams);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/MetaMask/metamask-extension/issues/42/comments',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'token secret-token',
          'User-Agent': 'metamaskbot',
        }),
      }),
    );
  });

  it('returns the response on success', async () => {
    const mockResponse = { ok: true } as Response;
    mockFetch.mockResolvedValue(mockResponse);

    const result = await postCommentWithMetamaskBot(baseParams);

    expect(result).toBe(mockResponse);
  });

  it('throws when the response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      text: () => Promise.resolve('not allowed'),
    } as unknown as Response);

    await expect(postCommentWithMetamaskBot(baseParams)).rejects.toThrow(
      "Post comment failed with status 'Forbidden': not allowed",
    );
  });
});
