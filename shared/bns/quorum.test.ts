import { assertBnsReadRpcUrls, ethCallWithQuorum } from './quorum';

describe('shared/bns eth_call quorum', () => {
  const urls = [
    'https://rpc-a.example',
    'https://rpc-b.example',
    'https://rpc-c.example',
  ] as const;

  it('requires three unique canonical HTTPS origins', () => {
    expect(() =>
      assertBnsReadRpcUrls([
        'https://rpc-a.example',
        'https://rpc-a.example',
        'https://rpc-b.example',
      ]),
    ).toThrow('exactly three unique');
    expect(() =>
      assertBnsReadRpcUrls([
        'http://rpc-a.example',
        'https://rpc-b.example',
        'https://rpc-c.example',
      ]),
    ).toThrow('canonical HTTPS');
  });

  it('returns the agreed eth_call result when two of three match', async () => {
    const fetchImpl = jest.fn(async (url: string) => {
      const result =
        url.includes('rpc-c')
          ? '0xdead'
          : '0x0000000000000000000000001111111111111111111111111111111111111111';
      return {
        ok: true,
        json: async () => ({ result }),
      } as Response;
    });

    const value = await ethCallWithQuorum(
      {
        to: '0x1111111111111111111111111111111111111111',
        data: '0x1234',
      },
      { rpcUrls: urls, fetchImpl, timeoutMs: 1000 },
    );

    expect(value).toBe(
      '0x0000000000000000000000001111111111111111111111111111111111111111',
    );
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('fails closed when answers disagree or only one endpoint succeeds', async () => {
    const disagree = jest.fn(async (url: string) => {
      // Distinct payloads per host so no two endpoints agree.
      let result = '0x01';
      if (url.includes('rpc-b')) {
        result = '0x02';
      } else if (url.includes('rpc-c')) {
        result = '0x03';
      }
      return {
        ok: true,
        json: async () => ({ result }),
      } as Response;
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl: disagree, timeoutMs: 1000 },
      ),
    ).rejects.toThrow('quorum not met');

    const single = jest.fn(async (url: string) => {
      if (!url.includes('rpc-a')) {
        return { ok: false, json: async () => ({}) } as Response;
      }
      return {
        ok: true,
        json: async () => ({ result: '0x01' }),
      } as Response;
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl: single, timeoutMs: 1000 },
      ),
    ).rejects.toThrow('quorum not met');
  });

  /**
   * H2.3 — controlled hang / timeout behaviour.
   * Fetch implementations must honour AbortSignal so a hung RPC cannot stall
   * quorum indefinitely or force a single-endpoint success.
   */
  it('times out a hung endpoint and still forms quorum from two fast peers', async () => {
    const agreed =
      '0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const fetchImpl = jest.fn(
      async (url: string, init?: RequestInit): Promise<Response> => {
        if (url.includes('rpc-a')) {
          await new Promise<void>((_resolve, reject) => {
            const onAbort = () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            };
            if (init?.signal?.aborted) {
              onAbort();
              return;
            }
            init?.signal?.addEventListener('abort', onAbort, { once: true });
            // Never resolve unless aborted — simulates an open socket hang.
          });
        }
        return {
          ok: true,
          json: async () => ({ result: agreed }),
        } as Response;
      },
    );

    const started = Date.now();
    const value = await ethCallWithQuorum(
      { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
      { rpcUrls: urls, fetchImpl, timeoutMs: 80 },
    );
    const elapsed = Date.now() - started;

    expect(value).toBe(agreed);
    expect(elapsed).toBeLessThan(2000);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('fails closed when endpoints report DNS resolution failure (H2.4)', async () => {
    const fetchImpl = jest.fn(async () => {
      throw Object.assign(new TypeError('fetch failed'), {
        cause: { code: 'ENOTFOUND', hostname: 'rpc-a.example' },
      });
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl, timeoutMs: 100 },
      ),
    ).rejects.toThrow('quorum not met');
  });

  it('forms quorum when one endpoint is DNS-failed and two agree (H2.4)', async () => {
    const agreed =
      '0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const fetchImpl = jest.fn(async (url: string) => {
      if (url.includes('rpc-a')) {
        throw Object.assign(new TypeError('getaddrinfo ENOTFOUND'), {
          cause: { code: 'ENOTFOUND' },
        });
      }
      return {
        ok: true,
        json: async () => ({ result: agreed }),
      } as Response;
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl, timeoutMs: 100 },
      ),
    ).resolves.toBe(agreed);
  });

  it('fails closed when two endpoints hang past timeout and only one answers', async () => {
    const fetchImpl = jest.fn(
      async (url: string, init?: RequestInit): Promise<Response> => {
        if (url.includes('rpc-a') || url.includes('rpc-b')) {
          await new Promise<void>((_resolve, reject) => {
            const onAbort = () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            };
            if (init?.signal?.aborted) {
              onAbort();
              return;
            }
            init?.signal?.addEventListener('abort', onAbort, { once: true });
          });
        }
        return {
          ok: true,
          json: async () => ({ result: '0x01' }),
        } as Response;
      },
    );

    const started = Date.now();
    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl, timeoutMs: 80 },
      ),
    ).rejects.toThrow('quorum not met');
    expect(Date.now() - started).toBeLessThan(2000);
  });

  /**
   * H2.5 — controlled malicious body / TLS verification failures.
   * Not a public MITM drill; proves forged peers cannot break 2-of-3 when only
   * one is compromised, and cert errors are treated as dead peers.
   */
  it('H2.5: one MITM forged eth_call body loses to two honest peers', async () => {
    const honest =
      '0x000000000000000000000000cccccccccccccccccccccccccccccccccccccccc';
    const forged =
      '0x000000000000000000000000dddddddddddddddddddddddddddddddddddddddd';
    const fetchImpl = jest.fn(async (url: string) => {
      if (url.includes('rpc-a')) {
        return { ok: true, json: async () => ({ result: forged }) } as Response;
      }
      return { ok: true, json: async () => ({ result: honest }) } as Response;
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl, timeoutMs: 100 },
      ),
    ).resolves.toBe(honest);
  });

  it('H2.5: TLS cert verification failure on one peer still forms quorum', async () => {
    const honest =
      '0x000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const fetchImpl = jest.fn(async (url: string) => {
      if (url.includes('rpc-a')) {
        throw Object.assign(new Error('unable to verify the first certificate'), {
          code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
          cause: { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' },
        });
      }
      return { ok: true, json: async () => ({ result: honest }) } as Response;
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl, timeoutMs: 100 },
      ),
    ).resolves.toBe(honest);
  });

  it('H2.5: triple TLS failure fails closed', async () => {
    const fetchImpl = jest.fn(async () => {
      throw Object.assign(new Error('certificate has expired'), {
        code: 'CERT_HAS_EXPIRED',
      });
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl, timeoutMs: 100 },
      ),
    ).rejects.toThrow('quorum not met');
  });

  it('H2.5 residual: two MITM agreeing forged bodies win 2-of-3 (documented risk)', async () => {
    const honest =
      '0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff';
    const forged =
      '0x00000000000000000000000000000000000000000000000000000000000000aa';
    const fetchImpl = jest.fn(async (url: string) => {
      if (url.includes('rpc-c')) {
        return { ok: true, json: async () => ({ result: honest }) } as Response;
      }
      return { ok: true, json: async () => ({ result: forged }) } as Response;
    });

    await expect(
      ethCallWithQuorum(
        { to: '0x1111111111111111111111111111111111111111', data: '0x1234' },
        { rpcUrls: urls, fetchImpl, timeoutMs: 100 },
      ),
    ).resolves.toBe(forged);
  });
});
