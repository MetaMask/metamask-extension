import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { LoaderContext } from 'webpack';
import swcLoader, {
  type SwcLoaderOptions,
  type SwcConfig,
} from '../utils/loaders/swcLoader';
import { Combination, generateCases } from './helpers';

describe('swcLoader', () => {
  type CallbackArgs = Parameters<LoaderContext<SwcLoaderOptions>['callback']>;

  function generateData() {
    const source = ` export function hello(message: string)  {
  console.log(message)
}; `;
    const expected = `export function hello(message) {
    console.log(message);
}
`;

    // swc doesn't use node's fs module, so we can't mock
    const resourcePath = 'test.ts';

    let resolveCallback: (value: CallbackArgs) => void;
    const mockContext = {
      mode: 'production',
      sourceMap: true,
      getOptions: () => {
        return {};
      },
      resourcePath,
      async: () => {
        return (...args: CallbackArgs) => {
          resolveCallback(args);
        };
      },
    } as unknown as LoaderContext<SwcLoaderOptions>;
    const deferredPromise = new Promise<CallbackArgs>((resolve) => {
      resolveCallback = resolve;
    });
    mockContext.async = mockContext.async.bind(mockContext);
    return { context: mockContext, source, expected, deferredPromise };
  }

  it('should transform code', async () => {
    const { context, source, deferredPromise, expected } = generateData();
    const returnValue = swcLoader.call(context, source);

    assert.strictEqual(returnValue, undefined, 'should return undefined');
    const [err, content, map] = await deferredPromise;
    assert.strictEqual(err, null);
    assert.strictEqual(content, expected);
    const mapObj = JSON.parse(map as string);
    assert.deepStrictEqual(mapObj.sources, [context.resourcePath]);
  });

  it('should throw an error when options are invalid', () => {
    const { context, source } = generateData();
    context.getOptions = () => {
      return {
        invalid: true,
      } as unknown as SwcLoaderOptions;
    };
    assert.throws(
      () => swcLoader.call(context, source),
      /[ValidationError]: Invalid configuration object/u,
    );
  });

  it('should return an error when code is invalid', async () => {
    const { context, deferredPromise } = generateData();
    const brokenSource = 'this is not real code;';
    swcLoader.call(context, brokenSource);
    const [err, content, map] = await deferredPromise;
    assert(err);
    assert.match(err.message, /Syntax Error/u);
    assert.strictEqual(content, undefined);
    assert.strictEqual(map, undefined);
  });

  describe('getSwcLoader', () => {
    const matrix = {
      syntax: ['typescript', 'ecmascript'] as const,
      enableJsx: [true, false] as const,
      watch: [true, false] as const,
      isDevelopment: [true, false] as const,
    };
    generateCases(matrix).forEach(runTest);

    type TestCase = Combination<typeof matrix>;

    afterEach(() => {
      delete process.env.__HMR_READY__;
    });
    function runTest({ syntax, enableJsx, watch, isDevelopment }: TestCase) {
      it(`should return a loader with correct properties when syntax is ${syntax}, jsx is ${enableJsx}, watch is ${watch}, and isDevelopment is ${isDevelopment}`, () => {
        process.env.__HMR_READY__ = 'true';
        // helpers caches `__HMR_READY__` on initialization, so we need to a new
        // one after we mock `process.env.__HMR_READY__`.
        delete require.cache[require.resolve('../utils/helpers')];
        delete require.cache[require.resolve('../utils/loaders/swcLoader')];
        const {
          getSwcLoader,
        }: typeof import('../utils/loaders/swcLoader') = require('../utils/loaders/swcLoader');

        // note: this test isn't exhaustive of all possible `swcConfig`
        // properties; it is mostly intended as sanity check.
        const swcConfig: SwcConfig = {
          args: { watch },
          safeVariables: {},
          browsersListQuery: '',
          isDevelopment,
        };

        const loader = getSwcLoader(syntax, enableJsx, swcConfig);
        assert.strictEqual(
          loader.loader,
          require.resolve('../utils/loaders/swcLoader'),
        );
        assert.deepStrictEqual(loader.options.jsc.parser, {
          syntax,
          [syntax === 'typescript' ? 'tsx' : 'jsx']: enableJsx,
          importAttributes: true,
        });
        assert.deepStrictEqual(loader.options.jsc.transform.react, {
          development: isDevelopment,
          refresh: isDevelopment && watch,
        });
      });
    }
  });
});
