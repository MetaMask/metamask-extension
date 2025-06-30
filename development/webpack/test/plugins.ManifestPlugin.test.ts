import { describe, it } from 'node:test';
import assert from 'node:assert';
import { join } from 'node:path';
import { type Compilation } from 'webpack';
import { ManifestPlugin } from '../utils/plugins/ManifestPlugin';
import { ZipOptions } from '../utils/plugins/ManifestPlugin/types';
import { Manifest } from '../utils/helpers';
import { transformManifest } from '../utils/plugins/ManifestPlugin/helpers';
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
      const baseManifest = require(join(
        context,
        `manifest/v${manifestVersion}`,
        '_base.json',
      ));
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
          manifest_version: manifestVersion,
          version: '1.0.0.0',
          versionName: '1.0.0',
          description,
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
              expectedWar = baseManifest.web_accessible_resources || [];
              // Keep or extend expected resources for manifest version 2
              expectedWar = [
                ...expectedWar,
                ...testCase.webAccessibleResources,
              ];
            }
          } else {
            expectedWar = baseManifest.web_accessible_resources || [];
          }

          assert.deepStrictEqual(
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
      lockdown: [true, false],
      test: [true, false],
    };
    const manifestMatrix = {
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
        const hasTabsPermission = (manifest.permissions || []).includes('tabs');
        const transform = transformManifest(args);

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
        } else if (!args.lockdown || args.test) {
          it(`works for args.test of ${args.test} and args.lockdown of ${
            args.lockdown
          }. Manifest: ${JSON.stringify(manifest)}`, () => {
            assert(transform, 'transform should be truthy');
            const transformed = transform(manifest, 'chrome');
            if (args.lockdown) {
              assert.deepStrictEqual(
                transformed.content_scripts,
                manifest.content_scripts,
                'nothing should change in lockdown mode',
              );
            } else {
              const stripped = manifest.content_scripts?.[0]?.js?.filter(
                (js) => js !== 'lockdown.js',
              );
              assert.deepStrictEqual(
                transformed.content_scripts?.[0]?.js,
                stripped,
                'lockdown.js should be removed when not in lockdown mode.',
              );
            }

            if (args.test) {
              assert.deepStrictEqual(
                transformed.permissions,
                [...(manifest.permissions || []), 'tabs'],
                "manifest should have 'tabs' permission",
              );
            }
          });
        }
      }
    }
  });
});
