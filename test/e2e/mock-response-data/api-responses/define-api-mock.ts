import type {
  CompletedRequest,
  MockedEndpoint,
  Mockttp,
  RequestRuleBuilder,
} from 'mockttp';

/**
 * mockttp's `RulePriority.FALLBACK`. Not imported: this module also loads in
 * jsdom unit tests, where mockttp's runtime does not.
 */
export const FALLBACK_PRIORITY = 0;

/** Values a test sets on top of a fixture. Nested objects are partial too. */
export type Overrides<Fixture> = {
  [Key in keyof Fixture]?: Fixture[Key] extends readonly unknown[]
    ? Fixture[Key]
    : Fixture[Key] extends object
      ? Overrides<Fixture[Key]>
      : Fixture[Key];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Fixture first, then the test's values: nested objects merge, while arrays
 * and scalars from `overrides` replace the fixture's.
 *
 * @param fixture - The fixture body.
 * @param overrides - Values the test asserts.
 * @returns The merged body.
 */
export function withOverrides<Fixture extends object>(
  fixture: Fixture,
  overrides: Overrides<Fixture>,
): Fixture {
  const merged = { ...fixture } as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    const base = merged[key];
    merged[key] =
      isPlainObject(base) && isPlainObject(value)
        ? withOverrides(base, value)
        : value;
  }
  return merged as Fixture;
}

/**
 * Freezes a value and everything reachable from it, so a test that edits a
 * fixture cannot change the default for later tests in the same process.
 *
 * @param value - The value to freeze.
 * @returns The same value, frozen.
 */
function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

const PRIMITIVE_PLACEHOLDERS: Record<string, unknown> = {
  number: 0,
  string: '',
  boolean: false,
};

/**
 * The fixture entry's fields with none of its values. A list or record entry
 * describes one asset, so an entry for another asset takes only its shape and
 * never its id or market data.
 *
 * @param value - A fixture value.
 * @returns The same shape with neutral values.
 */
export function placeholderOf<Value>(value: Value): Value {
  if (Array.isArray(value)) {
    return (
      value.length > 0 && isPlainObject(value[0])
        ? [placeholderOf(value[0])]
        : []
    ) as Value;
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, placeholderOf(item)]),
    ) as Value;
  }
  return (PRIMITIVE_PLACEHOLDERS[typeof value] ?? null) as Value;
}

/** Context `mock-e2e.js` passes when it registers the defaults. */
export type DefaultMockContext = {
  chainId: number;
};

type DefaultMock<Body, Params> = {
  /** Narrows the default to one instance of the endpoint, e.g. one chain. */
  params?: (context: DefaultMockContext) => Params;
  /** Narrows the default to requests with these query values. */
  query?: Record<string, string>;
  /** Keeps answering after other matching rules, like `.always()`. */
  always?: boolean;
  /** Answers only when no rule at the default priority matches. */
  fallback?: boolean;
  /**
   * Builds the default from the request, for a default that answers by query
   * or from the request URL. Without it, the default is `body`.
   */
  reply?: (request: CompletedRequest, body: Body) => unknown;
};

export type ApiMockDefinition<
  Body,
  Input,
  Response,
  Params,
  Variant extends string,
> = {
  id: string;
  method: 'GET' | 'POST';
  /** Matches every request to the endpoint. */
  url: string | RegExp;
  /** Matches one instance of the endpoint, e.g. one chain or one host. */
  urlFor?: (params: Params) => string;
  /**
   * The live URL the fixture was taken from. `$NAME` comes from the
   * environment when the sync fetches it.
   */
  syncUrl: string;
  /**
   * Why `yarn test:e2e:sync-api-mocks` does not fetch `syncUrl`, for example
   * a POST or an authenticated endpoint. POST endpoints are never fetched.
   */
  syncSkip?: string;
  /**
   * Dot paths, `''` for the root, of objects whose keys are data such as
   * chain names. The sync aligns their values and never adds or drops keys.
   */
  syncMapPaths?: string[];
  body: Body;
  /** Only for responses with a different structure than `body`. */
  variants?: Record<Variant, unknown>;
  /**
   * Builds the response from the test's input. Without it, the input is a
   * set of overrides applied on top of `body`.
   */
  build?: (input: Input) => Response;
  /** Registers the endpoint's default response in `mock-e2e.js`. */
  defaultMock?: DefaultMock<Body, Params>;
};

type OptionalInput<Input, Params> = object extends Input
  ? [input?: Input, params?: Params]
  : [input: Input, params?: Params];

export type ApiMock<Body, Input, Response, Params, Variant extends string> = {
  readonly id: string;
  readonly method: 'GET' | 'POST';
  readonly url: string | RegExp;
  readonly syncUrl: string;
  readonly syncSkip: string | undefined;
  readonly syncMapPaths: readonly string[];
  /** The fixture. Deep-frozen: build a new object to change a value. */
  readonly body: Body;
  /** Deep-frozen, like `body`. */
  readonly variants: Readonly<Record<Variant, unknown>>;
  /** True when `mock-e2e.js` registers a default for this endpoint. */
  readonly hasDefault: boolean;
  /** True when that default serves the fixture `body` unchanged. */
  readonly hasFixtureDefault: boolean;
  /**
   * Escape hatch: the endpoint's rule builder, for handlers that match on a
   * query or answer from a callback. The URL still comes from the definition.
   *
   * @param server - The mock server.
   * @param params - Narrows the matcher to one instance of the endpoint.
   */
  rule: (server: Mockttp, params?: Params) => RequestRuleBuilder;
  /** The response body for the given input, without registering a mock. */
  response: (...args: OptionalInput<Input, Params>) => Response;
  /**
   * Replaces the default for this endpoint. `.always()` keeps it ahead of
   * the default, which `mock-e2e.js` registers after the test's mocks. For
   * the same reason, the first `mock()` for a matcher answers every request,
   * so a second `mock()`, `mockVariant()` or `mockRaw()` for the same matcher
   * on the same server throws.
   */
  mock: (
    server: Mockttp,
    ...args: OptionalInput<Input, Params>
  ) => Promise<MockedEndpoint>;
  /** Serves a named variant in place of `body`. */
  mockVariant: (
    server: Mockttp,
    variant: Variant,
    params?: Params,
  ) => Promise<MockedEndpoint>;
  /** Escape hatch: serves a raw body that is neither `body` nor a variant. */
  mockRaw: (
    server: Mockttp,
    json: unknown,
    params?: Params,
  ) => Promise<MockedEndpoint>;
  /** Registers the default response. Called by `mock-e2e.js`. */
  mockDefault: (
    server: Mockttp,
    context: DefaultMockContext,
  ) => Promise<MockedEndpoint | undefined>;
};

type EndpointIdentity = {
  id: string;
  method: string;
  url: string | RegExp;
  syncUrl: string;
};

/**
 * Registry errors: an entry keyed by another id, an id defined twice, or two
 * definitions for the same endpoint (same method and URL matcher, or same
 * method and sync URL). A duplicate endpoint means two fixtures for one API,
 * and mockttp only serves the first.
 *
 * @param entries - `[key, endpoint]` pairs from the registry.
 * @returns One message per problem; empty when the registry is consistent.
 */
export function findDuplicateEndpoints(
  entries: [string, EndpointIdentity][],
): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  const claim = (key: string, id: string, what: string) => {
    const previous = seen.get(key);
    if (previous === undefined) {
      seen.set(key, id);
    } else if (previous !== id) {
      errors.push(`${id} and ${previous} define the same ${what}: ${key}`);
    }
  };
  const ids = new Set<string>();
  for (const [key, endpoint] of entries) {
    if (key !== endpoint.id) {
      errors.push(`${key} is registered under a different id (${endpoint.id})`);
    }
    if (ids.has(endpoint.id)) {
      errors.push(`${endpoint.id} is defined more than once`);
    }
    ids.add(endpoint.id);
    claim(
      `${endpoint.method} ${String(endpoint.url)}`,
      endpoint.id,
      'URL matcher',
    );
    claim(`${endpoint.method} ${endpoint.syncUrl}`, endpoint.id, 'sync URL');
  }
  return errors;
}

/** `mock()` matchers already registered on each mock server, with their endpoint id. */
const registeredMatchers = new WeakMap<Mockttp, Map<string, string>>();

/**
 * Records an `.always()` override for a matcher, and throws when the server
 * already has one: mockttp would never serve the second.
 *
 * @param server - The mock server.
 * @param method - The HTTP method.
 * @param matcher - The URL matcher the override uses.
 * @param id - The endpoint id, for the error message.
 */
function claimMatcher(
  server: Mockttp,
  method: string,
  matcher: string | RegExp,
  id: string,
): void {
  const claimed = registeredMatchers.get(server) ?? new Map<string, string>();
  registeredMatchers.set(server, claimed);
  const key = `${method} ${String(matcher)}`;
  const previous = claimed.get(key);
  if (previous !== undefined) {
    throw new Error(
      `${id}: a mock for ${key} is already registered on this server (by ${previous}). mockttp serves the first .always() rule, so this one would never answer. Pass every value to the first mock() call instead.`,
    );
  }
  claimed.set(key, id);
}

/**
 * Defines one API endpoint for E2E mocks: its matcher, fixture body,
 * variants and override path.
 *
 * @param definition - The endpoint definition.
 * @returns The endpoint with its mock helpers.
 */
export function defineApiMock<
  Body extends object,
  Input = Overrides<Body>,
  Response = Body,
  Params = never,
  Variant extends string = never,
>(
  definition: ApiMockDefinition<Body, Input, Response, Params, Variant>,
): ApiMock<Body, Input, Response, Params, Variant> {
  const { id, method, url, urlFor, syncUrl, build, defaultMock } = definition;
  const body = deepFreeze(definition.body);
  const variants = deepFreeze(
    (definition.variants ?? {}) as Record<Variant, unknown>,
  );

  const matcherFor = (params?: Params) =>
    params !== undefined && urlFor ? urlFor(params) : url;

  const rule = (server: Mockttp, params?: Params) => {
    const matcher = matcherFor(params);
    return method === 'GET' ? server.forGet(matcher) : server.forPost(matcher);
  };

  const override = (server: Mockttp, params?: Params) => {
    claimMatcher(server, method, matcherFor(params), id);
    return rule(server, params).always();
  };

  const response = (input?: Input): Response =>
    build
      ? build(input as Input)
      : (withOverrides(
          body,
          (input ?? {}) as Overrides<Body>,
        ) as unknown as Response);

  const reply =
    (json: () => unknown) =>
    (builder: RequestRuleBuilder): Promise<MockedEndpoint> =>
      builder.thenCallback(() => ({ statusCode: 200, json: json() }));

  return {
    id,
    method,
    url,
    syncUrl,
    syncSkip: definition.syncSkip,
    syncMapPaths: definition.syncMapPaths ?? [],
    body,
    variants,
    hasDefault: Boolean(defaultMock),
    hasFixtureDefault: Boolean(defaultMock && !defaultMock.reply),
    rule,
    response: (...args) => response(args[0]),
    mock: (server, ...args) =>
      reply(() => response(args[0]))(override(server, args[1])),
    mockVariant: (server, variant, params) => {
      if (!(variant in variants)) {
        throw new Error(`No "${variant}" variant for the ${id} mock`);
      }
      return reply(() => variants[variant])(override(server, params));
    },
    mockRaw: (server, json, params) =>
      reply(() => json)(override(server, params)),
    mockDefault: async (server, context) => {
      if (!defaultMock) {
        return undefined;
      }
      let builder = rule(server, defaultMock.params?.(context));
      if (defaultMock.query) {
        builder = builder.withQuery(defaultMock.query);
      }
      if (defaultMock.fallback) {
        builder = builder.asPriority(FALLBACK_PRIORITY);
      }
      if (defaultMock.always) {
        builder = builder.always();
      }
      const { reply: replyFor } = defaultMock;
      if (replyFor) {
        return builder.thenCallback(async (request) => ({
          statusCode: 200,
          json: await replyFor(request, body),
        }));
      }
      return reply(() => body)(builder);
    },
  };
}
