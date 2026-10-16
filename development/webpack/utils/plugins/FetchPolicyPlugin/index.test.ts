/** @jest-environment node */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { it } from '@jest/globals';
import webpack from 'webpack';
import { LavaMoatPlugin } from '@lavamoat/webpack';
import type { FetchPolicyApi } from '../../../../../app/scripts/lib/fetch-policy';
import { FetchPolicyPlugin } from '.';

describe('FetchPolicyPlugin', () => {
  it.each([false, true])(
    'installs before captured fetch references (LavaMoat: %s)',
    async (lavamoat) => {
      const directory = mkdtempSync(join(tmpdir(), 'fetch-policy-webpack-'));
      try {
        // A tiny real bundle exercises runtime ordering, transpilation, SES and
        // scuttling without building the entire extension.
        writeFileSync(
          join(directory, 'package.json'),
          '{"name":"fetch-policy-test","version":"1.0.0","dependencies":{"fetch-consumer":"1.0.0"}}',
        );
        const dependency = join(directory, 'node_modules/fetch-consumer');
        mkdirSync(dependency, { recursive: true });
        writeFileSync(
          join(dependency, 'package.json'),
          '{"name":"fetch-consumer","version":"1.0.0","main":"index.ts"}',
        );
        writeFileSync(
          join(dependency, 'index.ts'),
          'module.exports = { fetch: fetch.bind(globalThis), canUpdate: typeof globalThis.metamaskFetchPolicy !== "undefined" };',
        );
        writeFileSync(
          join(directory, 'entry.ts'),
          'globalThis.testHooks.capture(require("fetch-consumer"));',
        );
        const compiler = webpack({
          mode: 'development',
          devtool: false,
          context: resolve(__dirname, '../../../../../app'),
          entry: { 'service-worker.ts': join(directory, 'entry.ts') },
          output: { path: directory, filename: 'service-worker.js' },
          target: 'webworker',
          plugins: [
            new FetchPolicyPlugin(),
            ...(lavamoat
              ? [
                  new LavaMoatPlugin({
                    rootDir: directory,
                    policy: {
                      resources: {
                        'fetch-consumer': { globals: { fetch: true } },
                      },
                    },
                    inlineLockdown: /service-worker\.js$/u,
                    scuttleGlobalThis: {
                      enabled: true,
                      exceptions: ['metamaskFetchPolicy', 'testHooks'],
                    },
                    lockdown: {
                      errorTaming: 'unsafe',
                      stackFiltering: 'verbose',
                    },
                  }),
                ]
              : []),
          ],
        });
        await new Promise<void>((resolveBuild, reject) => {
          compiler.run((error, stats) => {
            compiler.close((closeError) => {
              if (error || closeError || stats?.hasErrors()) {
                reject(
                  error ??
                    closeError ??
                    new Error(stats?.toString({ all: false, errors: true })),
                );
              } else {
                resolveBuild();
              }
            });
          });
        });
        let capturedFetch: typeof fetch | undefined;
        let dependencyCanUpdate: boolean | undefined;
        const nativeFetch = jest.fn().mockResolvedValue(new Response('ok'));
        const realm = {
          fetch: nativeFetch,
          Request,
          URL,
          AbortSignal,
          location: {
            href: 'chrome-extension://extension-id/service-worker.js',
          },
          chrome: {
            runtime: {
              id: 'extension-id',
              getURL: (path: string) =>
                `chrome-extension://extension-id${path}`,
              onMessage: { addListener: jest.fn() },
            },
          },
          testHooks: {
            capture: (value: { fetch: typeof fetch; canUpdate: boolean }) => {
              capturedFetch = value.fetch;
              dependencyCanUpdate = value.canUpdate;
            },
          },
          metamaskFetchPolicy: undefined as FetchPolicyApi | undefined,
        };

        runInNewContext(
          readFileSync(join(directory, 'service-worker.js'), 'utf8'),
          realm,
        );

        if (!capturedFetch || !realm.metamaskFetchPolicy) {
          throw new Error('The entrypoint did not receive the fetch policy');
        }
        expect(dependencyCanUpdate).toBe(!lavamoat);
        await expect(capturedFetch('https://example.com')).rejects.toThrow(
          'domain not allowed',
        );
        realm.metamaskFetchPolicy.update({ completedOnboarding: true });
        await capturedFetch('https://example.com');
        realm.metamaskFetchPolicy.update({ allowedDomains: [] });
        await expect(capturedFetch('https://example.com')).rejects.toThrow(
          'domain not allowed',
        );
        expect(nativeFetch).toHaveBeenCalledTimes(1);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
