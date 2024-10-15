import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SelfInjectPlugin } from '../utils/plugins/SelfInjectPlugin';
import { generateCases, type Combination, mockWebpack } from './helpers';

describe('SelfInjectPlugin', () => {
  const matrix = {
    test: [/\.js$/u, /\.ts$/u] as const,
    filename: ['file.js', 'file.ts'],
    source: ['console.log(3);'],
    // sourceMap generated via https://www.digitalocean.com/community/tools/minify
    map: [
      null,
      '{"version":3,"file":"file.js","names":["console","log"],"sources":["0"],"mappings":"AAAAA,QAAQC,IAAI"}',
    ],
    devtool: ['source-map', 'hidden-source-map', false] as const,
  };

  generateCases(matrix).forEach(runTest);

  function runTest({
    test,
    filename,
    source,
    map,
    devtool,
  }: Combination<typeof matrix>) {
    it(`should produce valid output when test is ${test}, filename is ${filename}, map is ${
      map ? 'available' : 'missing'
    }, and devtool is ${devtool}`, () => {
      const { compiler, compilation } = mockWebpack(
        [filename],
        [source],
        [map],
        devtool,
      );

      const plugin = new SelfInjectPlugin({ test });
      plugin.apply(compiler);

      if (filename.match(test)) {
        // we should have matched our file so it should have been updated:

        assert.strictEqual(compilation.updateAsset.mock.callCount(), 1);
        const newAsset = compilation.updateAsset.mock.calls[0].result;
        assert(newAsset, 'newAsset should be defined');
        const { source: newSource, map: newMap } = newAsset.sourceAndMap();

        // `newMap` should be `null` here, because the file has been transformed
        // to be self-injecting, so there is no way to map it anymore.
        assert.strictEqual(newMap, null);

        if (map !== null && devtool === 'source-map') {
          // if we have a map and devtool is `source-map` the newSource should
          // reference the `sourceMappingURL`
          assert.strictEqual(
            newSource,
            `{let d=document,s=d.createElement('script');s.textContent="${source}\\n//# sourceMappingURL=${filename}.map"+\`\\n//# sourceURL=\${(globalThis.browser||chrome).runtime.getURL("${filename}")};\`;s.nonce=btoa(browser.runtime.getURL('/'));d.documentElement.appendChild(s).remove()}`,
          );
        } else {
          // the new source should NOT reference the new sourcemap, since it's
          // "hidden" (or we aren't generating source maps at all). Notice that
          // we DO still include `sourceURL`, as this aids in debugging
          // (and development) gives the injected source a name that will show
          // in the console if the source throws an exception or logs to the
          // console.
          assert.strictEqual(
            newSource,
            `{let d=document,s=d.createElement('script');s.textContent="console.log(3);"+\`\\n//# sourceURL=\${(globalThis.browser||chrome).runtime.getURL("${filename}")};\`;s.nonce=btoa(browser.runtime.getURL('/'));d.documentElement.appendChild(s).remove()}`,
          );
        }

        if (map) {
          // If we provided a `map` the source map should have been emitted as
          // a separate asset. Note that this happens even when devtool is set
          // to `false`, as this means the map file already existed and we
          // should not remove it (we don't care how it got there). The devtool
          // directive is about whether to generate a new map, not whether to
          // emit an existing one.
          assert.strictEqual(compilation.emitAsset.mock.callCount(), 1);
          const [sourceMapFilename, sourceMapSource] =
            compilation.emitAsset.mock.calls[0].arguments;
          assert.strictEqual(sourceMapFilename, `${filename}.map`);
          assert.strictEqual(sourceMapSource.source(), map);
        }
      } else {
        // we should not have matched our file so there should be no changes
        assert.strictEqual(compilation.updateAsset.mock.callCount(), 0);

        // and no new assets should have been emitted
        assert.strictEqual(compilation.emitAsset.mock.callCount(), 0);
      }
    });
  }
});
