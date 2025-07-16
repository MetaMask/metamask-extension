import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LoaderContext } from 'webpack';
import { FeatureLabels } from '@metamask/build-utils';
import codeFenceLoader, {
  getCodeFenceLoader,
  CodeFenceLoaderOptions,
} from '../utils/loaders/codeFenceLoader';

describe('codeFenceLoader', () => {
  type CallbackArgs = Parameters<
    LoaderContext<CodeFenceLoaderOptions>['callback']
  >;

  function generateData({ omitFeature }: { omitFeature: boolean }) {
    const featureLabel = 'feature-label';
    const fencedSource = `///: BEGIN:ONLY_INCLUDE_IF(${featureLabel})
console.log('I am Groot.');
///: END:ONLY_INCLUDE_IF`;
    const source = `
console.log('I am Groot.');
${fencedSource}
console.log('I am Groot.');
`;
    const expected = omitFeature
      ? source.replace(`${fencedSource}\n`, '')
      : source;

    let resolveCallback: (value: CallbackArgs) => void;
    const mockContext = {
      getOptions: () => {
        return {
          features: {
            active: new Set(omitFeature ? [] : [featureLabel]),
            all: new Set([featureLabel]),
          },
        };
      },
      resourcePath: '<resource-path>',
      callback: (...args: CallbackArgs) => resolveCallback(args),
    } as unknown as LoaderContext<CodeFenceLoaderOptions>;
    const deferredPromise = new Promise<CallbackArgs>((resolve) => {
      resolveCallback = resolve;
    });
    mockContext.callback = mockContext.callback.bind(mockContext);
    return { context: mockContext, source, expected, deferredPromise };
  }

  [false, true].forEach((omitFeature) => {
    it(`should ${omitFeature ? '' : 'not '}remove source when feature is ${
      omitFeature ? 'not ' : ''
    }active`, async () => {
      const data = generateData({ omitFeature });
      const returnValue = codeFenceLoader.call(data.context, data.source);

      assert.strictEqual(returnValue, undefined, 'should return undefined');
      const [err, content] = await data.deferredPromise;
      assert.strictEqual(err, null);
      assert.strictEqual(content, data.expected);
    });
  });

  it('should throw an error when options are invalid', () => {
    const data = generateData({ omitFeature: false });
    data.context.getOptions = () => {
      // invalid options
      return {} as unknown as CodeFenceLoaderOptions;
    };
    assert.throws(
      () => codeFenceLoader.call(data.context, data.source),
      /Invalid configuration object/u,
    );
  });

  it('should return an error when code fences are invalid', async () => {
    const data = generateData({ omitFeature: false });
    data.source = '///: BEGIN:ONLY_INCLUDE_IF\nconsole.log("I am Groot.");\n'; // invalid because there is no end comment
    const returnValue = codeFenceLoader.call(data.context, data.source);
    assert.strictEqual(returnValue, undefined, 'should return undefined');
    const [err, content] = await data.deferredPromise;
    assert(err);
    assert.deepStrictEqual(
      err.message,
      'Invalid code fence parameters in file "<resource-path>":\nNo parameters specified.',
    );
    assert.strictEqual(content, undefined);
  });

  describe('getCodeFenceLoader', () => {
    it('should return a loader with correct properties', () => {
      const features: FeatureLabels = { active: new Set(), all: new Set() };
      const result = getCodeFenceLoader(features);

      assert.deepStrictEqual(result, {
        loader: require.resolve('../utils/loaders/codeFenceLoader'),
        options: { features },
      });
    });
  });
});
