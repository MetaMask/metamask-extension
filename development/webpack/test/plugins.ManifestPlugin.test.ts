import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { join } from 'node:path';
import { type Compilation } from 'webpack';
import { ManifestPlugin } from '../utils/plugins/ManifestPlugin';
import { ZipOptions } from '../utils/plugins/ManifestPlugin/types';
import { Manifest } from '../utils/helpers';
import { transformManifest } from '../utils/plugins/ManifestPlugin/helpers';
import { MANIFEST_DEV_KEY } from '../../build/constants';
import { generateCases, type Combination, mockWebpack } from './helpers';

describe('ManifestPlugin', () => {
  describe('Plugin', () => {
    const matrix = {
      zip: [true, false],
      files: [
        [
          {
            // will be compressed
            name: 'filename.js',
            source: Buffer.from('console.log(1 + 2);', 'utf8'),
          },
        ],
        [
          {
            // will be compressed
            name: 'filename.js',
            source: Buffer.from('console.log(1 + 2);', 'utf8'),
          },
          {
            // will be omitted
            name: 'filename.js.map',
            source: Buffer.alloc(0),
          },
          {
            // will not be compressed
            name: 'pixel.png',
            source: Buffer.from([
              137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0,
              0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 55, 110, 249, 36, 0, 0, 0, 10,
              73, 68, 65, 84, 120, 1, 99, 96, 0, 0, 0, 2, 0, 1, 115, 117, 1, 24,
              0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
            ]),
          },
        ],
      ],
      browsers: [['chrome', 'firefox'], ['chrome']] as const,
      fixture: ['empty', 'complex'],
      description: [null, 'description'],
      manifestVersion: [2, 3] as const,
      webAccessibleResources: [undefined, ['filename.map.js']],
    };
    generateCases(matrix).forEach(runTest);

    type TestCase = Combination<typeof matrix>;

    function runTest(testCase: TestCase) {
      const {
        browsers,
        fixture,
        files,
        description,
        manifestVersion,
        webAccessibleResources,
        zip,
      } = testCase;
      const context = join(__dirname, `fixtures/ManifestPlugin/${fixture}`);
      const baseManifest = require(
        join(context, `manifest/v${manifestVersion}`, '_base.json'),
      );
      const expectedAssets = getExpectedAssets(zip, browsers, files);
      const validateManifest = getValidateManifest(testCase, baseManifest);

      it(`should produce a ${
        zip ? 'zip file' : 'folder'
      } for browsers [${browsers.join(
        ', ',
      )}] using the v${manifestVersion} "${fixture}" manifest, including files [${files
        .map((file) => file.name)
        .join(', ')}], ${
        description ? 'a description' : 'no description'
      }, and ${
        webAccessibleResources ? webAccessibleResources.length : 0
      } web_accessible_resources`, async () => {
        const { compiler, compilation, promise } = mockWebpack(
          files.map(({ name }) => name),
          files.map(({ source }) => source),
          files.map(() => null),
        );
        compilation.options.context = context;
        const manifestPlugin = new ManifestPlugin({
          browsers,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          manifest_version: manifestVersion,
          version: '1.0.0.0',
          versionName: '1.0.0',
          description,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          web_accessible_resources: webAccessibleResources,
          ...getZipOptions(zip),
        });
        manifestPlugin.apply(compiler);
        await promise;

        assert.deepStrictEqual(Object.keys(compilation.assets), expectedAssets);
        validateManifest(compilation as unknown as Compilation);
      });
    }

    function getZipOptions(
      zip: boolean,
    ): ({ zip: true } & ZipOptions) | { zip: false } {
      if (zip) {
        return {
          zip: true,
          zipOptions: {
            level: 0,
            mtime: 1711141205825,
            excludeExtensions: ['.map'],
            outFilePath: '[browser]/extension.zip',
          },
        };
      }
      return {
        zip: false,
      };
    }

    function getExpectedAssets(
      zip: boolean,
      browsers: readonly string[],
      files: { name: string }[],
    ) {
      const assets: string[] = [];
      if (zip) {
        browsers.forEach((browser) => {
          assets.push(`${browser}/extension.zip`);
        });
      }
      browsers.forEach((browser) => {
        assets.push(`${browser}/manifest.json`);
        assets.push(...files.map(({ name }) => `${browser}/${name}`));
      });
      return [...new Set(assets)]; // unique
    }
    function getValidateManifest(testCase: TestCase, baseManifest: Manifest) {
      // Handle case when the output is a zip file
      if (testCase.zip) {
        return () => {
          // Assume the validation is successful, as unzipping and checking contents is skipped
          assert.ok(true, 'Zip file creation assumed successful.');
        };
      }

      // Common validation for non-zip outputs, applicable to both manifest versions 2 and 3
      return (compilation: Compilation) => {
        testCase.browsers.forEach((browser) => {
          const manifest = compilation.assets[`${browser}/manifest.json`];
          const json = JSON.parse(manifest.source().toString()) as Manifest;

          // Validate description, if applicable
          if (testCase.description) {
            assert(
              json.description,
              "should have a 'description' in the manifest",
            );
            const descMessage = `should have the correct description in ${browser} manifest`;
            assert(
              json.description.endsWith(testCase.description),
              descMessage,
            );
          }

          // Validate web accessible resources
          let expectedWar: Manifest['web_accessible_resources'];
          if (testCase.webAccessibleResources) {
            if (baseManifest.manifest_version === 3) {
              // Extend expected resources for manifest version 3
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              expectedWar = baseManifest.web_accessible_resources || [];
              expectedWar = [
                {
                  // the manifest plugin only supports `<all_urls>` for manifest version 3
                  // so we don't test other `matches`.
                  matches: ['<all_urls>'],
                  resources: [
                    ...(expectedWar[0]?.resources || []),
                    ...testCase.webAccessibleResources,
                  ],
                },
              ];
            } else {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              expectedWar = baseManifest.web_accessible_resources || [];
              // Keep or extend expected resources for manifest version 2
              expectedWar = [
                ...expectedWar,
                ...testCase.webAccessibleResources,
              ];
            }
          } else {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            expectedWar = baseManifest.web_accessible_resources || [];
          }

          assert.deepStrictEqual(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            json.web_accessible_resources || [],
            expectedWar,
            "should have the correct 'web_accessible_resources' in the manifest",
          );
        });
      };
    }
  });

  describe('should transform the manifest object', () => {
    const keep = ['scripts/contentscript.js', 'scripts/inpage.js'];
    const argsMatrix = {
      test: [true, false],
    };
    const manifestMatrix = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      content_scripts: [
        undefined,
        [],
        [{ js: [...keep] }],
        [{ js: ['lockdown.js', ...keep] }],
      ],
      permissions: [undefined, [], ['tabs'], ['something']],
    };
    generateCases(argsMatrix).forEach(setupTests);

    function setupTests(args: Combination<typeof argsMatrix>) {
      generateCases(manifestMatrix).forEach(runTest);

      function runTest(baseManifest: Combination<typeof manifestMatrix>) {
        const manifest = baseManifest as unknown as chrome.runtime.Manifest;
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        const hasTabsPermission = (manifest.permissions || []).includes('tabs');
        const transform = transformManifest(args, false);

        if (args.test && hasTabsPermission) {
          it("throws in test mode when manifest already contains 'tabs' permission", () => {
            assert(transform, 'transform should be truthy');
            const p = () => {
              transform(manifest, 'chrome');
            };
            assert.throws(
              p,
              /manifest contains 'tabs' already; this transform should be removed./u,
              'should throw when manifest contains tabs already',
            );
          });
        } else if (args.test) {
          it(`works for args.test of ${args.test}. Manifest: ${JSON.stringify(manifest)}`, () => {
            assert(transform, 'transform should be truthy');
            const transformed = transform(manifest, 'chrome');

            if (args.test) {
              assert.deepStrictEqual(
                transformed.permissions,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                [...(manifest.permissions || []), 'tabs'],
                "manifest should have 'tabs' permission",
              );
            }
          });
        }
      }
    }
  });

  describe('manifest flags in development mode', () => {
    const emptyTestManifest = {} as chrome.runtime.Manifest;
    const notEmptyTestManifest = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _flags: { remoteFeatureFlags: { testFlag: false, testFlag2: 'value1' } },
    } as unknown as chrome.runtime.Manifest;
    const mockFlags = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _flags: { remoteFeatureFlags: { testFlag: true } },
      key: MANIFEST_DEV_KEY,
    };
    const manifestOverridesPath = 'testManifestOverridesPath.json';
    const fs = require('node:fs');
    const { mock } = require('node:test');
    const { resolve } = require('node:path');

    afterEach(() => mock.restoreAll());

    it('adds manifest flags in development mode with path provided and empty manifest', () => {
      mock.method(fs, 'readFileSync', (path: string, options: object) => {
        if (path === resolve(__dirname, '../../../', manifestOverridesPath)) {
          return JSON.stringify(mockFlags);
        }
        return fs.readFileSync.original(path, options);
      });
      const transform = transformManifest(
        { test: false },
        true,
        manifestOverridesPath,
      );
      assert(transform, 'transform should be truthy');

      const transformed = transform(emptyTestManifest, 'chrome');
      console.log('Transformed:', transformed);
      assert.deepStrictEqual(
        transformed,
        mockFlags,
        'manifest should have flags in development mode',
      );
    });

    it('overwrites existing manifest properties with override values but keeps original properties', () => {
      mock.method(fs, 'readFileSync', (path: string, options: object) => {
        if (path === resolve(__dirname, '../../../', manifestOverridesPath)) {
          return JSON.stringify(mockFlags);
        }
        return fs.readFileSync.original(path, options);
      });
      const transform = transformManifest(
        { test: false },
        true,
        manifestOverridesPath,
      );
      assert(transform, 'transform should be truthy');

      const transformed = transform(notEmptyTestManifest, 'chrome');
      assert.deepStrictEqual(
        transformed,
        {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          _flags: {
            remoteFeatureFlags: {
              testFlag2: 'value1',
              testFlag: true,
            },
          },
          key: MANIFEST_DEV_KEY,
        },
        'manifest should merge original properties with overrides, with overrides taking precedence',
      );
    });

    it('handles missing manifest flags file with path provided', () => {
      mock.method(fs, 'readFileSync', () => {
        const error = new Error('File not found') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      });

      const transform = transformManifest(
        { test: false },
        true,
        manifestOverridesPath,
      );
      assert(transform, 'transform should be truthy');

      assert.throws(
        () => transform(emptyTestManifest, 'chrome'),
        {
          message: `Manifest override file not found: ${manifestOverridesPath}`,
        },
        'should throw when manifest override file is not found',
      );
    });

    it('silently ignores non-ENOENT filesystem errors', () => {
      const transform = transformManifest(
        { test: false },
        true,
        manifestOverridesPath,
      );
      assert(transform, 'transform should be truthy');

      const originalError = new Error(
        'Permission denied',
      ) as NodeJS.ErrnoException;
      originalError.code = 'EACCES';

      mock.method(fs, 'readFileSync', () => {
        throw originalError;
      });

      const transformed = transform(emptyTestManifest, 'chrome');
      assert.deepStrictEqual(
        transformed._flags,
        undefined,
        'should not have flags when file read fails with non-ENOENT error',
      );
    });
  });
});
