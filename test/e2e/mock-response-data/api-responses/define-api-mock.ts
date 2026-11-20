import type { MockedEndpoint, Mockttp, RequestRuleBuilder } from 'mockttp';

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

type DefaultMock<Params> = {
  /** Narrows the default to one instance of the endpoint, e.g. one chain. */
  params?: (context: DefaultMockContext) => Params;
  /** Keeps answering after other matching rules, like `.always()`. */
  always?: boolean;
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
  /** The live URL the fixture was taken from. */
  syncUrl: string;
  body: Body;
  /** Only for responses with a different structure than `body`. */
  variants?: Record<Variant, unknown>;
  /**
   * Builds the response from the test's input. Without it, the input is a
   * set of overrides applied on top of `body`.
   */
  build?: (input: Input) => Response;
  /**
   * Registers `body` as the default response in `mock-e2e.js`. Endpoints
   * whose default needs a query or callback handler register it there with
   * `rule()` instead.
   */
  defaultMock?: DefaultMock<Params>;
};

type OptionalInput<Input, Params> = object extends Input
  ? [input?: Input, params?: Params]
  : [input: Input, params?: Params];

export type ApiMock<Body, Input, Response, Params, Variant extends string> = {
  readonly id: string;
  readonly method: 'GET' | 'POST';
  readonly url: string | RegExp;
  readonly syncUrl: string;
  readonly body: Body;
  readonly variants: Readonly<Record<Variant, unknown>>;
  readonly hasDefault: boolean;
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
   * the default, which `mock-e2e.js` registers after the test's mocks.
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
  const { id, method, url, urlFor, syncUrl, body, build, defaultMock } =
    definition;
  const variants = (definition.variants ?? {}) as Record<Variant, unknown>;

  const rule = (server: Mockttp, params?: Params) => {
    const matcher = params !== undefined && urlFor ? urlFor(params) : url;
    return method === 'GET' ? server.forGet(matcher) : server.forPost(matcher);
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
    body,
    variants,
    hasDefault: Boolean(defaultMock),
    rule,
    response: (...args) => response(args[0]),
    mock: (server, ...args) =>
      reply(() => response(args[0]))(rule(server, args[1]).always()),
    mockVariant: (server, variant, params) => {
      if (!(variant in variants)) {
        throw new Error(`No "${variant}" variant for the ${id} mock`);
      }
      return reply(() => variants[variant])(rule(server, params).always());
    },
    mockRaw: (server, json, params) =>
      reply(() => json)(rule(server, params).always()),
    mockDefault: async (server, context) => {
      if (!defaultMock) {
        return undefined;
      }
      const builder = rule(server, defaultMock.params?.(context));
      return reply(() => body)(defaultMock.always ? builder.always() : builder);
    },
  };
}
