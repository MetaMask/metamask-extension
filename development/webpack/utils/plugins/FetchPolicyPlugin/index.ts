import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { transformSync } from '@swc/core';
import {
  RuntimeModule,
  type Compiler,
  type WebpackPluginInstance,
} from 'webpack';

/** Installs the fetch gate before LavaMoat and application entrypoints run. */
export class FetchPolicyPlugin implements WebpackPluginInstance {
  private readonly allowTestFixtures: boolean;

  constructor(allowTestFixtures = false) {
    this.allowTestFixtures = allowTestFixtures;
  }

  apply(compiler: Compiler): void {
    const { allowTestFixtures } = this;
    const filename = join(compiler.context, 'scripts/lib/fetch-policy.ts');
    compiler.hooks.thisCompilation.tap('FetchPolicyPlugin', (compilation) => {
      compilation.fileDependencies.add(filename);
      const { code } = transformSync(readFileSync(filename, 'utf8'), {
        filename,
        swcrc: false,
        configFile: false,
        jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
        module: { type: 'commonjs' },
      });
      class FetchPolicyRuntimeModule extends RuntimeModule {
        constructor() {
          // LavaMoat's static shims use STAGE_BASIC and its endowments are
          // captured at STAGE_TRIGGER. Run before both, including without LM.
          super('fetch policy', RuntimeModule.STAGE_NORMAL - 1);
        }

        generate(): string {
          return `(() => { const exports = {};\n${code}\nexports.installFetchPolicy(globalThis, ${allowTestFixtures}); })();`;
        }
      }

      compilation.hooks.additionalTreeRuntimeRequirements.tap(
        'FetchPolicyPlugin',
        (chunk) => {
          // The injected provider runs in the website's realm. Never change
          // that site's fetch; content scripts have their own isolated realm.
          if (chunk.name !== 'scripts/inpage.js') {
            compilation.addRuntimeModule(chunk, new FetchPolicyRuntimeModule());
          }
        },
      );
    });
  }
}
