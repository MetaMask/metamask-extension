/**
 * @jest-environment node
 */
import http from 'http';
import { getLocal, type Mockttp } from 'mockttp';
import { defineApiMock, placeholderOf, withOverrides } from './define-api-mock';

const BODY = { value: 'fixture', nested: { a: 1, b: 2 }, list: [1, 2] };

const endpoint = defineApiMock({
  id: 'test-endpoint',
  method: 'GET',
  url: /^http:\/\/api\.test\/networks\/\d+\/data(?:\?.*)?$/u,
  urlFor: ({ chainId }: { chainId: number }) =>
    `http://api.test/networks/${chainId}/data`,
  syncUrl: 'http://api.test/networks/1/data',
  body: BODY,
  variants: { failed: { error: 'failed' } },
  defaultMock: { params: ({ chainId }) => ({ chainId }) },
});

/**
 * Sends a GET through the mock server, used as an HTTP proxy, so the request
 * keeps its absolute URL.
 *
 * @param server - The running mock server.
 * @param url - The absolute URL to request.
 * @returns The status code and parsed JSON body.
 */
function proxyGet(
  server: Mockttp,
  url: string,
): Promise<{ status: number | undefined; json: unknown }> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: 'localhost',
        port: server.port,
        method: 'GET',
        path: url,
        headers: { host: new URL(url).host },
      },
      (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          let json: unknown = data;
          try {
            json = JSON.parse(data);
          } catch {
            // Unmatched requests answer with plain text.
          }
          resolve({ status: response.statusCode, json });
        });
      },
    );
    request.on('error', reject);
    request.end();
  });
}

describe('defineApiMock', () => {
  let server: Mockttp;

  beforeEach(async () => {
    server = getLocal();
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('override priority', () => {
    it('serves the override for every request when the default is registered after it', async () => {
      await endpoint.mock(server, { value: 'override' }, { chainId: 1 });
      await endpoint.mockDefault(server, { chainId: 1 });

      for (let i = 0; i < 3; i++) {
        const { json } = await proxyGet(
          server,
          'http://api.test/networks/1/data',
        );
        expect(json).toStrictEqual({ ...BODY, value: 'override' });
      }
    });

    it('falls back to the default after one request when the override has no completion rule', async () => {
      await endpoint
        .rule(server, { chainId: 1 })
        .thenJson(200, { value: 'override' });
      await endpoint.mockDefault(server, { chainId: 1 });

      const values = [];
      for (let i = 0; i < 3; i++) {
        const { json } = await proxyGet(
          server,
          'http://api.test/networks/1/data',
        );
        values.push((json as { value: string }).value);
      }

      expect(values).toStrictEqual(['override', 'fixture', 'fixture']);
    });

    it('keeps the first override when the default also uses always', async () => {
      const alwaysDefault = defineApiMock({
        id: 'always-default',
        method: 'GET',
        url: 'http://api.test/always',
        syncUrl: 'http://api.test/always',
        body: BODY,
        defaultMock: { always: true },
      });
      await alwaysDefault.mock(server, { value: 'override' });
      await alwaysDefault.mockDefault(server, { chainId: 1 });

      for (let i = 0; i < 2; i++) {
        const { json } = await proxyGet(server, 'http://api.test/always');
        expect((json as { value: string }).value).toBe('override');
      }
    });
  });

  describe('mockDefault', () => {
    it('serves the fixture body only for the instance from the context', async () => {
      await endpoint.mockDefault(server, { chainId: 5 });

      expect(
        (await proxyGet(server, 'http://api.test/networks/5/data')).json,
      ).toStrictEqual(BODY);
      expect(
        (await proxyGet(server, 'http://api.test/networks/6/data')).status,
      ).toBe(503);
    });

    it('registers nothing for an endpoint without a default', async () => {
      const noDefault = defineApiMock({
        id: 'no-default',
        method: 'GET',
        url: 'http://api.test/none',
        syncUrl: 'http://api.test/none',
        body: BODY,
      });

      expect(noDefault.hasFixtureDefault).toBe(false);
      expect(await noDefault.mockDefault(server, { chainId: 1 })).toBe(
        undefined,
      );
      expect((await proxyGet(server, 'http://api.test/none')).status).toBe(503);
    });
  });

  describe('mock', () => {
    it('matches every instance when no params are given', async () => {
      await endpoint.mock(server);

      expect(
        (await proxyGet(server, 'http://api.test/networks/7/data?x=1')).json,
      ).toStrictEqual(BODY);
    });
  });

  describe('mockVariant', () => {
    it('serves the named variant', async () => {
      await endpoint.mockVariant(server, 'failed');

      expect(
        (await proxyGet(server, 'http://api.test/networks/1/data')).json,
      ).toStrictEqual({ error: 'failed' });
    });

    it('throws for an unknown variant', () => {
      // @ts-expect-error: not a variant of this endpoint.
      expect(() => endpoint.mockVariant(server, 'missing')).toThrow(
        'No "missing" variant for the test-endpoint mock',
      );
    });
  });

  describe('mockRaw', () => {
    it('serves the raw body', async () => {
      await endpoint.mockRaw(server, { raw: true });

      expect(
        (await proxyGet(server, 'http://api.test/networks/1/data')).json,
      ).toStrictEqual({ raw: true });
    });
  });

  describe('response', () => {
    it('applies overrides and takes unset fields from the fixture', () => {
      expect(
        endpoint.response({ value: 'changed', nested: { a: 9 } }),
      ).toStrictEqual({
        value: 'changed',
        nested: { a: 9, b: 2 },
        list: [1, 2],
      });
    });

    it('returns the fixture without overrides', () => {
      expect(endpoint.response()).toStrictEqual(BODY);
    });

    it('uses the build function when the definition has one', () => {
      const built = defineApiMock({
        id: 'built',
        method: 'POST',
        url: 'http://api.test/built',
        syncUrl: 'http://api.test/built',
        body: BODY,
        build: (names: string[]) => names.map((name) => ({ name })),
      });

      expect(built.response(['a', 'b'])).toStrictEqual([
        { name: 'a' },
        { name: 'b' },
      ]);
    });

    it('rejects keys the fixture does not have', () => {
      // @ts-expect-error: misspelled field.
      endpoint.response({ valeu: 'x' });

      expect(true).toBe(true);
    });
  });

  describe('rule', () => {
    it('registers a POST rule for a POST endpoint', async () => {
      const post = defineApiMock({
        id: 'post',
        method: 'POST',
        url: 'http://api.test/post',
        syncUrl: 'http://api.test/post',
        body: BODY,
      });
      await post.mock(server);

      expect((await proxyGet(server, 'http://api.test/post')).status).toBe(503);
    });
  });
});

describe('defineApiMock freeze', () => {
  const frozen = defineApiMock({
    id: 'frozen',
    method: 'GET',
    url: 'http://api.test/frozen',
    syncUrl: 'http://api.test/frozen',
    body: { value: 'fixture', nested: { a: 1 }, list: [1, 2] },
    variants: { failed: { error: { code: 1 } } },
  });

  it('rejects edits to the body, at any depth', () => {
    const body = frozen.body as {
      value: string;
      nested: { a: number };
      list: number[];
    };

    expect(() => {
      body.value = 'changed';
    }).toThrow(TypeError);
    expect(() => {
      body.nested.a = 2;
    }).toThrow(TypeError);
    expect(() => {
      body.list.push(3);
    }).toThrow(TypeError);
    expect(frozen.body).toStrictEqual({
      value: 'fixture',
      nested: { a: 1 },
      list: [1, 2],
    });
  });

  it('rejects edits to the variants, at any depth', () => {
    const variants = frozen.variants as { failed: { error: { code: number } } };

    expect(() => {
      variants.failed.error.code = 2;
    }).toThrow(TypeError);
    expect(() => {
      (variants as Record<string, unknown>).other = {};
    }).toThrow(TypeError);
  });

  it('still returns a new, editable object from response()', () => {
    const response = frozen.response({ value: 'changed' });

    response.value = 'edited';

    expect(response.value).toBe('edited');
    expect(frozen.body.value).toBe('fixture');
  });
});

describe('withOverrides', () => {
  it('merges nested objects and replaces arrays and scalars', () => {
    expect(
      withOverrides(
        { a: { b: 1, c: 2 }, list: [1, 2], keep: 'x' },
        { a: { b: 3 }, list: [9] },
      ),
    ).toStrictEqual({ a: { b: 3, c: 2 }, list: [9], keep: 'x' });
  });
});

describe('placeholderOf', () => {
  it('keeps the shape and drops the values', () => {
    expect(
      placeholderOf({
        id: 'ethereum',
        price: 3010,
        active: true,
        missing: null,
        tags: ['a'],
        rows: [{ name: 'x' }],
      }),
    ).toStrictEqual({
      id: '',
      price: 0,
      active: false,
      missing: null,
      tags: [],
      rows: [{ name: '' }],
    });
  });
});
