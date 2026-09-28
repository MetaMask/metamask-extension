import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

type GlobalsPolicy = Record<string, boolean | 'write'>;
type Policy = {
  resources: Record<string, { globals?: GlobalsPolicy }>;
};

const requireFromLavaMoat = createRequire(require.resolve('@lavamoat/webpack'));
const createEndowmentsToolkit = requireFromLavaMoat(
  'lavamoat-core/src/endowmentsToolkit',
) as () => {
  copyWrappedGlobals: (source: object, target: object) => void;
  getEndowmentsForConfig: (
    source: object,
    policy: { globals: GlobalsPolicy },
    unwrapTo: object,
    unwrapFrom: object,
  ) => object;
};

describe('NetworkController LavaMoat policy', () => {
  for (const manifest of ['mv2', 'mv3']) {
    for (const variant of ['main', 'beta', 'flask', 'experimental']) {
      it(`${manifest}/${variant} preserves native receivers when binding RPC globals`, () => {
        const readPolicy = (filename: string): GlobalsPolicy => {
          const path = resolve(
            __dirname,
            `../../../lavamoat/webpack/${manifest}/${variant}/${filename}.json`,
          );
          const policy = JSON.parse(readFileSync(path, 'utf8')) as Policy;
          return policy.resources['@metamask/network-controller'].globals ?? {};
        };
        const globals = {
          ...readPolicy('policy'),
          ...readPolicy('policy-override'),
        };
        const { copyWrappedGlobals, getEndowmentsForConfig } =
          createEndowmentsToolkit();
        // Native browser APIs reject a compartment global as their receiver.
        // Node's fetch does not, so enforce that browser constraint here.
        const nativeGlobal = {
          fetch(this: unknown) {
            assert.equal(this, nativeGlobal, 'fetch received the wrong global');
            return 'response';
          },
          btoa(this: unknown) {
            assert.equal(this, nativeGlobal, 'btoa received the wrong global');
            return 'encoded';
          },
        };
        const rootGlobal = {};
        copyWrappedGlobals(nativeGlobal, rootGlobal);
        const compartment = {} as typeof nativeGlobal;
        Object.assign(
          compartment,
          getEndowmentsForConfig(
            rootGlobal,
            { globals },
            nativeGlobal,
            compartment,
          ),
        );

        // Match create-network-client's binding and later RpcService invocation.
        const rpcService = {
          fetch: compartment.fetch.bind(compartment),
          btoa: compartment.btoa.bind(compartment),
        };
        assert.equal(rpcService.fetch(), 'response');
        assert.equal(rpcService.btoa(), 'encoded');
      });
    }
  }
});
